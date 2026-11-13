"""Shared enumerations — part of the frozen API contract.

These become exact string-literal unions in the generated TypeScript types.
Changing a value is a contract change: regenerate `frontend/src/api/schema.d.ts`.
"""

from enum import StrEnum


class LanguageCode(StrEnum):
    EN = "en-IN"
    HI = "hi-IN"
    KN = "kn-IN"
    TE = "te-IN"
    TA = "ta-IN"


class ScriptVariant(StrEnum):
    NATIVE = "native"
    ROMANIZED = "romanized"
    CODE_MIXED = "code_mixed"


class AttackCategory(StrEnum):
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    INSTRUCTION_OVERRIDE = "instruction_override"
    SYSTEM_PROMPT_EXTRACTION = "system_prompt_extraction"
    SENSITIVE_DATA_LEAK = "sensitive_data_leak"
    HARMFUL_CONTENT = "harmful_content"  # what the bot SAYS: scam help, caste/religion bias, misinformation


class AttackWrapper(StrEnum):
    """Optional local (no-API) transformations applied after localization."""

    SCRIPT_SWITCH = "script_switch"
    ROLEPLAY_WRAP = "roleplay_wrap"
    TRANSLATION_WRAP = "translation_wrap"


class AttackMode(StrEnum):
    STATIC = "static"  # curated seed library, localized by Sarvam
    ADAPTIVE = "adaptive"  # Sarvam-105B attacker that learns from the target's refusals
    VOICE_REPLAY = "voice_replay"  # the same attacks re-sent as speech (Sarvam TTS -> STT) to compare with text


class FixApplyMode(StrEnum):
    WEBHOOK = "webhook"  # Chakravyuh pushes the patched prompt to the target's fix webhook
    MANUAL = "manual"  # the developer applied it themselves


class Mutation(StrEnum):
    """Every step that can appear in a test case's mutation chain."""

    ADAPTIVE = "adaptive"
    TRANSLATE = "translate"
    CODE_MIX = "code_mix"
    ROMANIZE = "romanize"
    SCRIPT_SWITCH = "script_switch"
    ROLEPLAY_WRAP = "roleplay_wrap"
    TRANSLATION_WRAP = "translation_wrap"
    TTS = "tts"


class Severity(StrEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


class Verdict(StrEnum):
    VULNERABLE = "vulnerable"
    SAFE = "safe"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"


class Confidence(StrEnum):
    CONFIRMED = "confirmed"  # a deterministic detector fired
    LIKELY = "likely"  # model judge only


class CampaignStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TargetKind(StrEnum):
    TEXT = "text"
    VOICE = "voice"


class HttpMethod(StrEnum):
    POST = "POST"
    PUT = "PUT"


class VerificationStatus(StrEnum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"


class VerificationMethod(StrEnum):
    TOKEN_FILE = "token_file"
    ALLOWLISTED_HOST = "allowlisted_host"


class RegressionOutcome(StrEnum):
    FIXED = "fixed"
    STILL_VULNERABLE = "still_vulnerable"
    FLAKY = "flaky"
    NEW_VULNERABILITY = "new_vulnerability"


class Modality(StrEnum):
    TEXT = "text"
    VOICE = "voice"


class AudioSource(StrEnum):
    TTS = "tts"
    UPLOAD = "upload"


class DetectorName(StrEnum):
    CANARY = "canary"
    MARKER = "marker"
    PII = "pii"
    PROMPT_LEAK = "prompt_leak"
    REFUSAL = "refusal"
    JUDGE = "judge"
