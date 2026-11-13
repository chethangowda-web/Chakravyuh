from fastapi import APIRouter

from app.schemas.enums import AttackCategory, AttackWrapper, LanguageCode, ScriptVariant, Severity
from app.schemas.system import (
    CategoryOption,
    LanguageOption,
    MetaEnumsResponse,
    ScriptVariantOption,
    SeverityOption,
    WrapperOption,
)

router = APIRouter(tags=["system"])

_META = MetaEnumsResponse(
    languages=[
        LanguageOption(value=LanguageCode.EN, label="English", native_label="English"),
        LanguageOption(value=LanguageCode.HI, label="Hindi", native_label="हिन्दी"),
        LanguageOption(value=LanguageCode.KN, label="Kannada", native_label="ಕನ್ನಡ"),
        LanguageOption(value=LanguageCode.TE, label="Telugu", native_label="తెలుగు"),
        LanguageOption(value=LanguageCode.TA, label="Tamil", native_label="தமிழ்"),
    ],
    script_variants=[
        ScriptVariantOption(
            value=ScriptVariant.NATIVE, label="Native script", description="Fully in the native script"
        ),
        ScriptVariantOption(
            value=ScriptVariant.ROMANIZED,
            label="Romanized",
            description="Indic language written in Latin script (e.g. Hinglish typing)",
        ),
        ScriptVariantOption(
            value=ScriptVariant.CODE_MIXED,
            label="Code-mixed",
            description="Indic language mixed with English words, as people actually chat",
        ),
    ],
    categories=[
        CategoryOption(
            value=AttackCategory.PROMPT_INJECTION,
            label="Prompt injection",
            description="Untrusted input smuggles new instructions into the model",
        ),
        CategoryOption(
            value=AttackCategory.JAILBREAK,
            label="Jailbreak",
            description="Role-play or persona tricks to bypass safety policies",
        ),
        CategoryOption(
            value=AttackCategory.INSTRUCTION_OVERRIDE,
            label="Instruction override",
            description="Direct attempts to replace the system's rules",
        ),
        CategoryOption(
            value=AttackCategory.SYSTEM_PROMPT_EXTRACTION,
            label="System prompt extraction",
            description="Attempts to reveal hidden system instructions",
        ),
        CategoryOption(
            value=AttackCategory.SENSITIVE_DATA_LEAK,
            label="Sensitive data leakage",
            description="Attempts to extract secrets, credentials or personal data",
        ),
        CategoryOption(
            value=AttackCategory.HARMFUL_CONTENT,
            label="Harmful content",
            description="UPI/OTP scam assistance, caste or religion bias, and regional misinformation",
        ),
    ],
    wrappers=[
        WrapperOption(
            value=AttackWrapper.SCRIPT_SWITCH,
            label="Script switch",
            description="Instruction in one script, payload in another",
        ),
        WrapperOption(
            value=AttackWrapper.ROLEPLAY_WRAP,
            label="Role-play frame",
            description="Wraps the attack inside a fictional scenario",
        ),
        WrapperOption(
            value=AttackWrapper.TRANSLATION_WRAP,
            label="Translation frame",
            description="Disguises the attack as a translation request",
        ),
    ],
    severities=[
        SeverityOption(value=Severity.CRITICAL, label="Critical", rank=4),
        SeverityOption(value=Severity.HIGH, label="High", rank=3),
        SeverityOption(value=Severity.MEDIUM, label="Medium", rank=2),
        SeverityOption(value=Severity.LOW, label="Low", rank=1),
        SeverityOption(value=Severity.NONE, label="None", rank=0),
    ],
)


@router.get("/meta/enums", operation_id="getMetaEnums")
def get_meta_enums() -> MetaEnumsResponse:
    return _META
