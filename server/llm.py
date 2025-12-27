from __future__ import annotations

import importlib.util
import sys
import json
import os
import re
from pathlib import Path
from typing import Any

import jsonschema
from openai import OpenAI


PROMPT_MODULE_PATH = Path(__file__).resolve().parent / "prompt_example.py"


class PromptModuleError(RuntimeError):
    pass


def load_prompt_module():
    if not PROMPT_MODULE_PATH.exists():
        raise PromptModuleError("prompt_example not found in repo root.")
    spec = importlib.util.spec_from_file_location("prompt_example", PROMPT_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise PromptModuleError("Unable to load prompt_example module.")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def strip_code_fences(text: str) -> str:
    return re.sub(r"^\s*```(?:json)?|\s*```$", "", text.strip(), flags=re.I | re.M)


def parse_json_response(raw_text: str) -> dict[str, Any]:
    cleaned = strip_code_fences(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'"answer"\s*:\s*"([^"]*)"', cleaned)
        if match:
            return {"answer": match.group(1).replace("\\n", "\n")}
    return {"answer": cleaned}


def ensure_message_alias(payload: dict[str, Any]) -> dict[str, Any]:
    if "message" not in payload and "answer" in payload:
        payload["message"] = payload["answer"]
    return payload


def safe_fallback_response() -> dict[str, Any]:
    return {
        "answer": "I couldn't generate a response right now. Please try again in a moment.",
        "message": "I couldn't generate a response right now. Please try again in a moment.",
        "reasoning_trace": [],
        "data_references": [],
        "recommendations": [],
        "follow_ups": [],
        "safety": {"disclaimer": "", "red_flags": []},
    }


def coalesce_blank_answer(payload: dict[str, Any]) -> dict[str, Any]:
    answer = str(payload.get("answer") or "").strip()
    if answer:
        return payload
    recommendations = payload.get("recommendations") or []
    if isinstance(recommendations, list) and recommendations:
        actions = []
        for rec in recommendations:
            if not isinstance(rec, dict):
                continue
            action = str(rec.get("action") or "").strip()
            if action:
                actions.append(action)
        if actions:
            summary = "Here are the most relevant next steps based on your data:"
            payload["answer"] = summary + "\n\n" + "\n".join(f"- {action}" for action in actions[:5])
            payload["message"] = payload["answer"]
            return payload
    payload["answer"] = "I couldn't generate a complete response. Please try again."
    payload["message"] = payload["answer"]
    return payload


def validate_against_schema(payload: dict[str, Any], schema: dict[str, Any]) -> None:
    jsonschema.validate(instance=payload, schema=schema)


def build_prompt_bundle(
    wearables_summary: dict[str, Any],
    coaching_context: dict[str, Any],
    user_query: str,
    response_schema: dict[str, Any],
):
    prompt_module = load_prompt_module()
    return prompt_module.build_prompt_bundle(
        wearables_summary=wearables_summary,
        coaching_context=coaching_context,
        user_query=user_query,
        response_schema=response_schema,
    )


def call_llm(bundle, model: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    client = OpenAI(api_key=api_key)
    max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "10000"))
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": bundle.system},
            {"role": "developer", "content": bundle.developer},
            {"role": "user", "content": bundle.user},
        ],
        temperature=0.6,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


def call_fixup_llm(
    bad_payload: dict[str, Any], schema: dict[str, Any], model: str
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    client = OpenAI(api_key=api_key)
    fix_system = "You fix JSON to match a schema. Return ONLY valid JSON that matches the schema."
    fix_user = "\n\n".join(
        [
            "SCHEMA:",
            json.dumps(schema, indent=2),
            "INVALID_JSON:",
            json.dumps(bad_payload, indent=2),
        ]
    )
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": fix_system},
            {"role": "user", "content": fix_user},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content or ""


def call_llm_messages(messages: list[dict[str, str]], model: str, temperature: float = 0.4) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    client = OpenAI(api_key=api_key)
    max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "10000"))
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def generate_coach_response(
    *,
    wearables_summary: dict[str, Any],
    coaching_context: dict[str, Any],
    user_query: str,
) -> dict[str, Any]:
    prompt_module = load_prompt_module()
    response_schema = prompt_module.RESPONSE_SCHEMA
    analysis_schema = getattr(prompt_module, "ANALYSIS_SCHEMA", response_schema)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    analysis_bundle = build_prompt_bundle(
        wearables_summary=wearables_summary,
        coaching_context=coaching_context,
        user_query=user_query,
        response_schema=analysis_schema,
    )

    try:
        raw_analysis = call_llm(analysis_bundle, model)
        analysis_payload = parse_json_response(raw_analysis)
        validate_against_schema(analysis_payload, analysis_schema)
    except Exception:
        try:
            raw_fix = call_fixup_llm(
                analysis_payload if "analysis_payload" in locals() else {},
                analysis_schema,
                model,
            )
            analysis_payload = parse_json_response(raw_fix)
            validate_against_schema(analysis_payload, analysis_schema)
        except Exception:
            return safe_fallback_response()

    coach_system = (
        "You are a human health coach. Use the analysis JSON and the user query to write a clear, "
        "user-friendly response with appropriate detail. Do not include the analysis fields. "
        "Return ONLY valid JSON with the shape: {\"answer\": \"...\"}."
    )
    coach_user = "\n\n".join(
        [
            "USER_QUERY:",
            user_query.strip(),
            "ANALYSIS_JSON:",
            json.dumps(analysis_payload, indent=2),
        ]
    )
    try:
        raw_answer = call_llm_messages(
            [
                {"role": "system", "content": coach_system},
                {"role": "user", "content": coach_user},
            ],
            model,
            temperature=0.5,
        )
        answer_payload = parse_json_response(raw_answer)
    except Exception:
        answer_payload = {}

    answer_text = str(answer_payload.get("answer") or "").strip()
    merged = dict(analysis_payload)
    merged["answer"] = answer_text
    merged = ensure_message_alias(merged)
    merged = coalesce_blank_answer(merged)
    try:
        validate_against_schema(merged, response_schema)
        return merged
    except Exception:
        try:
            raw_fix = call_fixup_llm(merged, response_schema, model)
            fixed = ensure_message_alias(parse_json_response(raw_fix))
            fixed = coalesce_blank_answer(fixed)
            validate_against_schema(fixed, response_schema)
            return fixed
        except Exception:
            return safe_fallback_response()
