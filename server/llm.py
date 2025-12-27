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
    max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "900"))
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


def call_fixup_llm(bad_payload: dict[str, Any], schema: dict[str, Any], model: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    client = OpenAI(api_key=api_key)
    fix_system = (
        "You fix JSON to match a schema. Return ONLY valid JSON that matches the schema."
    )
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


async def generate_coach_response(
    *,
    wearables_summary: dict[str, Any],
    coaching_context: dict[str, Any],
    user_query: str,
) -> dict[str, Any]:
    prompt_module = load_prompt_module()
    response_schema = prompt_module.RESPONSE_SCHEMA
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    bundle = build_prompt_bundle(
        wearables_summary=wearables_summary,
        coaching_context=coaching_context,
        user_query=user_query,
        response_schema=response_schema,
    )

    try:
        raw = call_llm(bundle, model)
        payload = ensure_message_alias(parse_json_response(raw))
        validate_against_schema(payload, response_schema)
        return payload
    except Exception:
        try:
            raw_fix = call_fixup_llm(payload if "payload" in locals() else {}, response_schema, model)
            fixed = ensure_message_alias(parse_json_response(raw_fix))
            validate_against_schema(fixed, response_schema)
            return fixed
        except Exception:
            return safe_fallback_response()
