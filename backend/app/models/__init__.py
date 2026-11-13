"""SQLModel tables. Importing this package registers every table on the metadata."""

from app.models.audio import AudioAsset
from app.models.cache import SarvamCache
from app.models.campaign import Campaign
from app.models.fix import FixProposal
from app.models.helpfulness import HelpfulnessRun
from app.models.regression import RegressionRun
from app.models.result import Result
from app.models.shield import ShieldEvent
from app.models.target import Target
from app.models.test_case import TestCase

__all__ = [
    "AudioAsset",
    "Campaign",
    "FixProposal",
    "HelpfulnessRun",
    "RegressionRun",
    "Result",
    "SarvamCache",
    "ShieldEvent",
    "Target",
    "TestCase",
]
