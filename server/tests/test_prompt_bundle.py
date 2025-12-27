from llm import build_prompt_bundle


def test_prompt_bundle_structure():
    wearables_summary = {"window_days": 14, "aggregates": {}, "derived_scores": {}}
    coaching_context = {"meeting_id": "", "coach_brief": [], "goals": [], "constraints": [], "plan": {}, "open_questions": []}
    response_schema = {"type": "object", "required": ["answer"], "properties": {"answer": {"type": "string"}}}
    bundle = build_prompt_bundle(
        wearables_summary=wearables_summary,
        coaching_context=coaching_context,
        user_query="Test query",
        response_schema=response_schema,
    )
    assert bundle.system
    assert bundle.developer
    assert bundle.user == "Test query"
