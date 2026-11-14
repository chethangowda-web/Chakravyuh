/**
 * Friendly aliases for generated contract types. Never hand-write API shapes —
 * alias them from `components["schemas"]` so they track the backend automatically.
 */
import type { components } from '../api/schema'

type Schemas = components['schemas']

// Enums
export type LanguageCode = Schemas['LanguageCode']
export type ScriptVariant = Schemas['ScriptVariant']
export type AttackCategory = Schemas['AttackCategory']
export type AttackWrapper = Schemas['AttackWrapper']
export type Severity = Schemas['Severity']
export type Verdict = Schemas['Verdict']
export type Confidence = Schemas['Confidence']
export type CampaignStatus = Schemas['CampaignStatus']
export type RegressionOutcome = Schemas['RegressionOutcome']
export type DetectorName = Schemas['DetectorName']

// System
export type HealthResponse = Schemas['HealthResponse']
export type MetaEnums = Schemas['MetaEnumsResponse']
export type ErrorResponse = Schemas['ErrorResponse']

// Domain
export type Target = Schemas['TargetOut']
export type TargetCreate = Schemas['TargetCreate']
export type Campaign = Schemas['CampaignOut']
export type CampaignLive = Schemas['CampaignLiveOut']
export type ShieldOverview = Schemas['ShieldOverview']
export type ChallengeAttempt = Schemas['AttemptOut']
export type ChallengeRun = Schemas['RunOut']
export type ChallengeReadiness = Schemas['ReadinessOut']
export type ChallengeEvidence = Schemas['EvidenceItem']
export type Journey = Schemas['Journey']
export type Formation = Schemas['Formation']
export type FormationAttack = Schemas['FormationAttack']
export type JourneyStep = Schemas['JourneyStep']
export type ShieldChatResult = Schemas['ShieldChatResponse']
export type ShieldAction = ShieldChatResult['action']
export type FalseBlockResult = Schemas['FalseBlockResult']
export type LiveEvent = Schemas['LiveEvent']
export type CampaignConfig = Schemas['CampaignConfig-Input']
export type ResultSummary = Schemas['ResultSummary']
export type ResultDetail = Schemas['ResultDetail']
export type SecurityBreakdown = Schemas['SecurityBreakdown']
export type DashboardSummary = Schemas['DashboardSummary']
export type Regression = Schemas['RegressionOut']
export type AttackMode = Schemas['AttackMode']
export type Mission = Schemas['MissionOut']
export type MissionTurn = Schemas['MissionTurn']
export type FixProposal = Schemas['FixProposalOut']
export type Hardening = Schemas['HardeningOut']
export type HardeningStep = Schemas['HardeningStep']
export type Helpfulness = Schemas['HelpfulnessOut']
export type Generalization = Schemas['GeneralizationOut']
export type VoiceComparison = Schemas['VoiceComparisonOut']
