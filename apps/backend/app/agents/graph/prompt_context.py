import re
from datetime import datetime, timezone

SUPPORTED_LANGUAGES: dict[str, str] = {
    "vi": "Vietnamese",
    "en": "English",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "fr": "French",
    "es": "Spanish",
}

_VI_DIACRITICS = set(
    "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
)
_VI_HINTS = (
    "xin chào",
    "xin chao",
    "của",
    "cua",
    "không",
    "khong",
    "được",
    "duoc",
    "tôi",
    "toi",
    "bạn",
    "ban",
    "thế nào",
    "the nao",
    "là gì",
    "la gi",
    "cho tôi",
    "cho toi",
    "hôm nay",
    "hom nay",
    "vui lòng",
    "vui long",
)


def normalize_language(code: str | None) -> str:
    if not code:
        return "en"
    token = code.strip().lower().split("-")[0]
    if token in SUPPORTED_LANGUAGES:
        return token
    if re.fullmatch(r"[a-z]{2}", token):
        return token
    return "en"


def detect_user_language(text: str) -> str:
    """Fast heuristic detection from user message (ISO 639-1)."""
    sample = text.strip()
    if not sample:
        return "en"

    if any(ch.lower() in _VI_DIACRITICS for ch in sample):
        return "vi"

    lower = sample.lower()
    if any(hint in lower for hint in _VI_HINTS):
        return "vi"

    for ch in sample:
        code = ord(ch)
        if 0x4E00 <= code <= 0x9FFF:
            return "zh"
        if 0x3040 <= code <= 0x30FF:
            return "ja"
        if 0xAC00 <= code <= 0xD7AF:
            return "ko"

    return "en"


def merge_language(heuristic: str, planner: str | None) -> str:
    """Prefer strong heuristic signals; otherwise use planner label."""
    h = normalize_language(heuristic)
    p = normalize_language(planner)
    if h == p:
        return h
    if h == "vi":
        return "vi"
    if p and p != "en":
        return p
    return h


def resolve_user_language(state) -> str:
    explicit = state.get("user_language")
    if explicit:
        return normalize_language(explicit)

    planner = state.get("planner_output") or {}
    planner_lang = planner.get("response_language")
    if planner_lang:
        return normalize_language(planner_lang)

    return detect_user_language(state.get("user_input", ""))


def language_instruction_from_code(code: str) -> str:
    normalized = normalize_language(code)
    name = SUPPORTED_LANGUAGES.get(normalized, normalized.upper())
    return (
        f"User language: {name} ({normalized}). "
        f"Write all of your output in {name} only — use the same language as the user's message."
    )


def language_instruction(state) -> str:
    return language_instruction_from_code(resolve_user_language(state))


def current_date_line() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%d (UTC)")


def format_tool_results(tool_results: list[dict] | None) -> str:
    if not tool_results:
        return "(none)"
    parts = []
    for entry in tool_results:
        tool = entry.get("tool", "unknown")
        result = entry.get("result", "")
        parts.append(f"[{tool}]\n{result}")
    return "\n\n".join(parts)


def format_rerank_docs(docs: list) -> str:
    if not docs:
        return "(none)"
    lines: list[str] = []
    for doc in docs:
        if isinstance(doc, dict):
            label = str(doc.get("type") or "context")
            body = str(doc.get("content") or "").strip()
            if body:
                lines.append(f"[{label}] {body}")
        else:
            lines.append(str(doc))
    return "\n".join(lines) if lines else "(none)"
