/**
 * GENERATED from the FastAPI OpenAPI spec by scripts/gen-api.mjs — DO NOT EDIT.
 * Change backend/app/schemas/* then run `npm run gen:api`.
 */

export interface paths {
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Health */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/meta/enums": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Meta Enums */
        get: operations["getMetaEnums"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/targets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Targets */
        get: operations["listTargets"];
        put?: never;
        /** Create Target */
        post: operations["createTarget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/targets/{target_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Target */
        get: operations["getTarget"];
        /** Update Target */
        put: operations["updateTarget"];
        post?: never;
        /** Delete Target */
        delete: operations["deleteTarget"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/targets/{target_id}/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Verify Target */
        post: operations["verifyTarget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/targets/{target_id}/test-connection": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Test Connection */
        post: operations["testTargetConnection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/attacks/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Templates */
        get: operations["listAttackTemplates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/attacks/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Preview Attack */
        post: operations["previewAttack"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/attacks/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Attack */
        post: operations["generateAttackParaphrases"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/estimate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Estimate Campaign */
        post: operations["estimateCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Campaigns */
        get: operations["listCampaigns"];
        put?: never;
        /** Create Campaign */
        post: operations["createCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Campaign */
        get: operations["getCampaign"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancel Campaign */
        post: operations["cancelCampaign"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/results": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Results */
        get: operations["listCampaignResults"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/regression": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Regression */
        post: operations["createRegression"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Live
         * @description Live pipeline view: per-stage counts and the latest attacks (poll while the campaign runs).
         */
        get: operations["getCampaignLive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Report */
        get: operations["getCampaignReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/missions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Missions */
        get: operations["listCampaignMissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/fixes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Fixes */
        get: operations["listCampaignFixes"];
        put?: never;
        /** Propose Fix */
        post: operations["proposeFix"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/fixes/{fix_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Fix */
        get: operations["getFix"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/fixes/{fix_id}/apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply Fix */
        post: operations["applyFix"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/campaigns/{campaign_id}/hardening": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Hardening */
        get: operations["getHardeningTimeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/results/{result_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Result */
        get: operations["getResult"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/synthesize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Synthesize */
        post: operations["synthesizeVoice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload */
        post: operations["uploadVoice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/replay/{campaign_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start Voice Replay
         * @description Replay a campaign's attacks as speech (Sarvam TTS -> STT -> target) for a text-vs-voice comparison.
         */
        post: operations["startVoiceReplay"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/replay/{campaign_id}/comparison": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Voice Comparison */
        get: operations["getVoiceComparison"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Run Voice Test */
        post: operations["runVoiceTest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/voice/audio/{audio_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Audio */
        get: operations["getVoiceAudio"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/regression/{regression_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Regression */
        get: operations["getRegression"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Summary */
        get: operations["getDashboardSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shield/{target_id}/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Shield Chat
         * @description Send a message to the protected target through Shield. Point your app's users (or a campaign) here.
         */
        post: operations["shieldChat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shield/{target_id}/protect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Protect
         * @description Create (or return) the '<name> + Shield' target, which can be attacked like any other target.
         */
        post: operations["protectTarget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shield/{target_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Overview
         * @description Shield stats, recent decisions, and the without-vs-with-Shield campaign comparison.
         */
        get: operations["getShieldOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shield/{target_id}/false-block-check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * False Block Check
         * @description Run the target's legitimate questions through Shield's input check: are real users let through?
         */
        post: operations["runFalseBlockCheck"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * AttackCategory
         * @enum {string}
         */
        AttackCategory: "prompt_injection" | "jailbreak" | "instruction_override" | "system_prompt_extraction" | "sensitive_data_leak" | "harmful_content";
        /** AttackGenerateRequest */
        AttackGenerateRequest: {
            /** Template Id */
            template_id: string;
            /**
             * Count
             * @default 3
             */
            count: number;
        };
        /** AttackGenerateResponse */
        AttackGenerateResponse: {
            /** Template Id */
            template_id: string;
            /** Paraphrases */
            paraphrases: string[];
        };
        /**
         * AttackMode
         * @enum {string}
         */
        AttackMode: "static" | "adaptive" | "voice_replay";
        /** AttackPreviewRequest */
        AttackPreviewRequest: {
            /** Template Id */
            template_id: string;
            /** Languages */
            languages: components["schemas"]["LanguageCode"][];
            /** Variants */
            variants: components["schemas"]["ScriptVariant"][];
            /** Wrappers */
            wrappers?: components["schemas"]["AttackWrapper"][];
        };
        /** AttackPreviewResponse */
        AttackPreviewResponse: {
            template: components["schemas"]["AttackTemplateOut"];
            /** Variants */
            variants: components["schemas"]["AttackVariantOut"][];
            /** Warnings */
            warnings: string[];
        };
        /** AttackTemplateList */
        AttackTemplateList: {
            /** Items */
            items: components["schemas"]["AttackTemplateOut"][];
        };
        /** AttackTemplateOut */
        AttackTemplateOut: {
            /** Id */
            id: string;
            category: components["schemas"]["AttackCategory"];
            /** Technique */
            technique: string;
            language: components["schemas"]["LanguageCode"];
            /** Text */
            text: string;
            /** Marker Required */
            marker_required: boolean;
            /** Notes */
            notes: string | null;
        };
        /** AttackVariantOut */
        AttackVariantOut: {
            language: components["schemas"]["LanguageCode"];
            variant: components["schemas"]["ScriptVariant"];
            /** Mutation Chain */
            mutation_chain: components["schemas"]["Mutation"][];
            /** Attack Text */
            attack_text: string;
            /** English Gloss */
            english_gloss: string | null;
            /** Detected Language */
            detected_language: string | null;
            /** Detected Script */
            detected_script: string | null;
            /** Marker Token */
            marker_token: string | null;
        };
        /**
         * AttackWrapper
         * @description Optional local (no-API) transformations applied after localization.
         * @enum {string}
         */
        AttackWrapper: "script_switch" | "roleplay_wrap" | "translation_wrap";
        /** AudioAssetOut */
        AudioAssetOut: {
            /** Id */
            id: string;
            source: components["schemas"]["AudioSource"];
            language: components["schemas"]["LanguageCode"] | null;
            /** Text */
            text: string | null;
            /** Duration S */
            duration_s: number | null;
            /** Url */
            url: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * AudioSource
         * @enum {string}
         */
        AudioSource: "tts" | "upload";
        /** Body_uploadVoice */
        Body_uploadVoice: {
            /**
             * File
             * @description WAV/WebM/OGG/MP3/M4A, max 25 s and 2 MB
             */
            file: string;
            language?: components["schemas"]["LanguageCode"] | null;
        };
        /** CampaignConfig */
        "CampaignConfig-Input": {
            /** @default static */
            mode: components["schemas"]["AttackMode"];
            /**
             * Max Turns
             * @description Adaptive mode: attempts per mission before giving up
             * @default 4
             */
            max_turns: number;
            /** Categories */
            categories: components["schemas"]["AttackCategory"][];
            /** Languages */
            languages: components["schemas"]["LanguageCode"][];
            /** Variants */
            variants: components["schemas"]["ScriptVariant"][];
            /** Wrappers */
            wrappers?: components["schemas"]["AttackWrapper"][];
            /**
             * Use Judge
             * @default true
             */
            use_judge: boolean;
            /**
             * Max Cases
             * @default 300
             */
            max_cases: number;
        };
        /** CampaignConfig */
        "CampaignConfig-Output": {
            /** @default static */
            mode: components["schemas"]["AttackMode"];
            /**
             * Max Turns
             * @description Adaptive mode: attempts per mission before giving up
             * @default 4
             */
            max_turns: number;
            /** Categories */
            categories: components["schemas"]["AttackCategory"][];
            /** Languages */
            languages: components["schemas"]["LanguageCode"][];
            /** Variants */
            variants: components["schemas"]["ScriptVariant"][];
            /** Wrappers */
            wrappers: components["schemas"]["AttackWrapper"][];
            /**
             * Use Judge
             * @default true
             */
            use_judge: boolean;
            /**
             * Max Cases
             * @default 300
             */
            max_cases: number;
        };
        /** CampaignCounts */
        CampaignCounts: {
            /**
             * Vulnerable
             * @default 0
             */
            vulnerable: number;
            /**
             * Safe
             * @default 0
             */
            safe: number;
            /**
             * Inconclusive
             * @default 0
             */
            inconclusive: number;
            /**
             * Errors
             * @default 0
             */
            errors: number;
            by_severity: components["schemas"]["SeverityCounts"];
        };
        /** CampaignCreate */
        CampaignCreate: {
            /** Target Id */
            target_id: number;
            /** Name */
            name: string;
            config: components["schemas"]["CampaignConfig-Input"];
        };
        /** CampaignEstimateRequest */
        CampaignEstimateRequest: {
            /** Target Id */
            target_id: number;
            config: components["schemas"]["CampaignConfig-Input"];
        };
        /** CampaignEstimateResponse */
        CampaignEstimateResponse: {
            /** Total Cases */
            total_cases: number;
            /** Estimated Target Calls */
            estimated_target_calls: number;
            /** Estimated Sarvam Calls */
            estimated_sarvam_calls: number;
            /** Capped */
            capped: boolean;
            /** Warnings */
            warnings: string[];
        };
        /** CampaignList */
        CampaignList: {
            /** Items */
            items: components["schemas"]["CampaignOut"][];
        };
        /**
         * CampaignLiveOut
         * @description Per-stage counts for the live pipeline view. Attacks run in parallel, so each count is
         *     'how many attacks have reached this step' rather than a single global phase.
         */
        CampaignLiveOut: {
            status: components["schemas"]["CampaignStatus"];
            mode: components["schemas"]["AttackMode"];
            /**
             * Planned
             * @description Attacks (or adaptive missions) planned
             */
            planned: number;
            /**
             * Written
             * @description Attack texts produced: translated by Sarvam and language-checked
             */
            written: number;
            /**
             * In Flight
             * @description Sent to the target, waiting for the reply or the verdict
             */
            in_flight: number;
            /**
             * Analysed
             * @description Replies with a verdict
             */
            analysed: number;
            /** Decided By Rules */
            decided_by_rules: number;
            /** Decided By Judge */
            decided_by_judge: number;
            /** Vulnerable */
            vulnerable: number;
            /** Safe */
            safe: number;
            /** Errors */
            errors: number;
            /** Recent */
            recent: components["schemas"]["LiveEvent"][];
        };
        /** CampaignOut */
        CampaignOut: {
            /** Id */
            id: number;
            /** Name */
            name: string;
            /** Target Id */
            target_id: number;
            /** Target Name */
            target_name: string;
            config: components["schemas"]["CampaignConfig-Output"];
            status: components["schemas"]["CampaignStatus"];
            /** Total Cases */
            total_cases: number;
            /** Completed Cases */
            completed_cases: number;
            /** Progress */
            progress: number;
            counts: components["schemas"]["CampaignCounts"];
            /** Parent Campaign Id */
            parent_campaign_id: number | null;
            /**
             * Regression Id
             * @description Set when this campaign is a regression rerun
             */
            regression_id: number | null;
            /**
             * Latest Regression Id
             * @description Most recent regression run of this campaign
             */
            latest_regression_id: number | null;
            /** Error Message */
            error_message: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Started At */
            started_at: string | null;
            /** Finished At */
            finished_at: string | null;
        };
        /** CampaignReport */
        CampaignReport: {
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            campaign: components["schemas"]["CampaignOut"];
            target: components["schemas"]["TargetOut"];
            breakdown: components["schemas"]["SecurityBreakdown"];
            /** Top Findings */
            top_findings: components["schemas"]["ResultDetail"][];
            /** Recommendations */
            recommendations: string[];
        };
        /**
         * CampaignStatus
         * @enum {string}
         */
        CampaignStatus: "queued" | "running" | "completed" | "failed" | "cancelled";
        /** CategoryOption */
        CategoryOption: {
            value: components["schemas"]["AttackCategory"];
            /** Label */
            label: string;
            /** Description */
            description: string;
        };
        /** CategoryStat */
        CategoryStat: {
            category: components["schemas"]["AttackCategory"];
            /** Total */
            total: number;
            /** Vulnerable */
            vulnerable: number;
            /** Vulnerability Rate */
            vulnerability_rate: number;
        };
        /**
         * Confidence
         * @enum {string}
         */
        Confidence: "confirmed" | "likely";
        /** DashboardSummary */
        DashboardSummary: {
            /** Total Campaigns */
            total_campaigns: number;
            breakdown: components["schemas"]["SecurityBreakdown"];
            /** Recent Campaigns */
            recent_campaigns: components["schemas"]["CampaignOut"][];
        };
        /** DetectorHit */
        DetectorHit: {
            detector: components["schemas"]["DetectorName"];
            /** Fired */
            fired: boolean;
            /** Score */
            score: number | null;
            /** Evidence */
            evidence: string | null;
            /** Spans */
            spans: components["schemas"]["TextSpan"][];
        };
        /**
         * DetectorName
         * @enum {string}
         */
        DetectorName: "canary" | "marker" | "pii" | "prompt_leak" | "refusal" | "judge";
        /** ErrorBody */
        ErrorBody: {
            /**
             * Code
             * @description Machine-readable error code, e.g. `not_found`
             */
            code: string;
            /** Message */
            message: string;
            /** Details */
            details: {
                [key: string]: unknown;
            } | null;
        };
        /** ErrorResponse */
        ErrorResponse: {
            error: components["schemas"]["ErrorBody"];
        };
        /** FalseBlockItem */
        FalseBlockItem: {
            language: components["schemas"]["LanguageCode"];
            /**
             * Question
             * @description The English question
             */
            question: string;
            /**
             * Text
             * @description What was sent through Shield (translated)
             */
            text: string;
            /** Reason */
            reason: string | null;
        };
        /** FalseBlockRequest */
        FalseBlockRequest: {
            /** Languages */
            languages?: components["schemas"]["LanguageCode"][];
        };
        /**
         * FalseBlockResult
         * @description Legitimate questions sent through Shield's input check: how many got through?
         */
        FalseBlockResult: {
            /** Total */
            total: number;
            /** Allowed */
            allowed: number;
            /** Blocked */
            blocked: components["schemas"]["FalseBlockItem"][];
        };
        /**
         * FixApplyMode
         * @enum {string}
         */
        FixApplyMode: "webhook" | "manual";
        /** FixApplyRequest */
        FixApplyRequest: {
            via: components["schemas"]["FixApplyMode"];
            /**
             * Trials
             * @default 1
             */
            trials: number;
        };
        /** FixList */
        FixList: {
            /** Items */
            items: components["schemas"]["FixProposalOut"][];
        };
        /** FixProposalOut */
        FixProposalOut: {
            /** Id */
            id: number;
            /** Campaign Id */
            campaign_id: number;
            /** Target Id */
            target_id: number;
            /** Summary */
            summary: string;
            /** Changes */
            changes: string[];
            /** Revised Prompt */
            revised_prompt: string | null;
            /** Addendum */
            addendum: string | null;
            /** Previous Prompt */
            previous_prompt: string | null;
            /** Failures Considered */
            failures_considered: number;
            /**
             * Fix Set Size
             * @description Successful attacks shown to the patch author
             */
            fix_set_size: number;
            /**
             * Heldout Set Size
             * @description Successful attacks held back to test generalization
             */
            heldout_set_size: number;
            helpfulness_before: components["schemas"]["HelpfulnessOut"] | null;
            helpfulness_after: components["schemas"]["HelpfulnessOut"] | null;
            /** Applied */
            applied: boolean;
            applied_via: components["schemas"]["FixApplyMode"] | null;
            /** Applied At */
            applied_at: string | null;
            /** Regression Id */
            regression_id: number | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * GeneralizationOut
         * @description Did the patch fix only the attacks it was shown, or also ones it never saw?
         */
        GeneralizationOut: {
            /** Fix Set Total */
            fix_set_total: number;
            /** Fix Set Still Vulnerable */
            fix_set_still_vulnerable: number;
            /** Heldout Total */
            heldout_total: number;
            /** Heldout Still Vulnerable */
            heldout_still_vulnerable: number;
            /** Complete */
            complete: boolean;
        };
        /** HardeningOut */
        HardeningOut: {
            /** Root Campaign Id */
            root_campaign_id: number;
            /** Latest Campaign Id */
            latest_campaign_id: number;
            /** Steps */
            steps: components["schemas"]["HardeningStep"][];
        };
        /** HardeningStep */
        HardeningStep: {
            /** Label */
            label: string;
            /** Campaign Id */
            campaign_id: number;
            /** Regression Id */
            regression_id: number | null;
            /** Fix Id */
            fix_id: number | null;
            status: components["schemas"]["CampaignStatus"];
            /**
             * Vulnerable
             * @description Attacks that still succeed at this step
             */
            vulnerable: number;
            /**
             * Rerun Total
             * @description Attacks replayed at this step (null for the original run)
             */
            rerun_total: number | null;
        };
        /** HealthResponse */
        HealthResponse: {
            /**
             * Status
             * @enum {string}
             */
            status: "ok" | "degraded";
            /** App Name */
            app_name: string;
            /** Version */
            version: string;
            /** Database Ok */
            database_ok: boolean;
            /** Sarvam Configured */
            sarvam_configured: boolean;
        };
        /** HeatmapCell */
        HeatmapCell: {
            language: components["schemas"]["LanguageCode"];
            category: components["schemas"]["AttackCategory"];
            /** Total */
            total: number;
            /** Vulnerable */
            vulnerable: number;
            /** Vulnerability Rate */
            vulnerability_rate: number;
        };
        /** HelpfulnessItem */
        HelpfulnessItem: {
            language: components["schemas"]["LanguageCode"];
            /** Question */
            question: string;
            /** Reply Excerpt */
            reply_excerpt: string | null;
            /**
             * Answered
             * @description null when the target errored
             */
            answered: boolean | null;
            /** Rationale */
            rationale: string | null;
        };
        /** HelpfulnessLanguageStat */
        HelpfulnessLanguageStat: {
            language: components["schemas"]["LanguageCode"];
            /** Total */
            total: number;
            /** Answered */
            answered: number;
        };
        /**
         * HelpfulnessOut
         * @description Over-refusal check: how many legitimate banking questions the bot still answers.
         */
        HelpfulnessOut: {
            /** Id */
            id: number;
            /**
             * Phase
             * @description 'before' or 'after' the fix
             */
            phase: string;
            status: components["schemas"]["CampaignStatus"];
            /** Total */
            total: number;
            /** Answered */
            answered: number;
            /** Errors */
            errors: number;
            /**
             * Answer Rate
             * @description answered / (total - errors); null until finished
             */
            answer_rate: number | null;
            /** By Language */
            by_language: components["schemas"]["HelpfulnessLanguageStat"][];
            /** Items */
            items: components["schemas"]["HelpfulnessItem"][];
        };
        /**
         * HttpMethod
         * @enum {string}
         */
        HttpMethod: "POST" | "PUT";
        /**
         * LanguageCode
         * @enum {string}
         */
        LanguageCode: "en-IN" | "hi-IN" | "kn-IN" | "te-IN" | "ta-IN";
        /** LanguageOption */
        LanguageOption: {
            value: components["schemas"]["LanguageCode"];
            /** Label */
            label: string;
            /** Native Label */
            native_label: string;
        };
        /** LanguageStat */
        LanguageStat: {
            language: components["schemas"]["LanguageCode"];
            /** Total */
            total: number;
            /** Vulnerable */
            vulnerable: number;
            /** Vulnerability Rate */
            vulnerability_rate: number;
        };
        /**
         * LiveEvent
         * @description One attack in the live feed: written (and translated), then answered and judged.
         */
        LiveEvent: {
            /** Test Case Id */
            test_case_id: number;
            /** Result Id */
            result_id: number | null;
            /** Turn */
            turn: number | null;
            language: components["schemas"]["LanguageCode"];
            variant: components["schemas"]["ScriptVariant"];
            category: components["schemas"]["AttackCategory"];
            /** Attack Excerpt */
            attack_excerpt: string;
            /**
             * Stage
             * @enum {string}
             */
            stage: "attacking" | "done";
            verdict: components["schemas"]["Verdict"] | null;
            severity: components["schemas"]["Severity"] | null;
            /** Decided By */
            decided_by: ("rules" | "judge") | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** MaskedHeader */
        MaskedHeader: {
            /** Name */
            name: string;
            /** Value Masked */
            value_masked: string;
        };
        /** MetaEnumsResponse */
        MetaEnumsResponse: {
            /** Languages */
            languages: components["schemas"]["LanguageOption"][];
            /** Script Variants */
            script_variants: components["schemas"]["ScriptVariantOption"][];
            /** Categories */
            categories: components["schemas"]["CategoryOption"][];
            /** Wrappers */
            wrappers: components["schemas"]["WrapperOption"][];
            /** Severities */
            severities: components["schemas"]["SeverityOption"][];
        };
        /** MissionList */
        MissionList: {
            /** Items */
            items: components["schemas"]["MissionOut"][];
            /** Breached */
            breached: number;
            /** Total */
            total: number;
        };
        /** MissionOut */
        MissionOut: {
            /** Mission Id */
            mission_id: string;
            category: components["schemas"]["AttackCategory"];
            language: components["schemas"]["LanguageCode"];
            /** Goal */
            goal: string;
            /** Breached */
            breached: boolean;
            /** Turns Used */
            turns_used: number;
            /** Winning Tactic */
            winning_tactic: string | null;
            /** Turns */
            turns: components["schemas"]["MissionTurn"][];
        };
        /** MissionTurn */
        MissionTurn: {
            /** Result Id */
            result_id: number;
            /** Turn */
            turn: number;
            /** Tactic */
            tactic: string | null;
            variant: components["schemas"]["ScriptVariant"];
            /** Attack Text */
            attack_text: string;
            /** English Meaning */
            english_meaning: string | null;
            /**
             * Attacker Note
             * @description Why the attacker chose this tactic (its reasoning)
             */
            attacker_note: string | null;
            /** Reply Excerpt */
            reply_excerpt: string | null;
            verdict: components["schemas"]["Verdict"];
            confidence: components["schemas"]["Confidence"] | null;
            severity: components["schemas"]["Severity"];
        };
        /**
         * Modality
         * @enum {string}
         */
        Modality: "text" | "voice";
        /**
         * Mutation
         * @description Every step that can appear in a test case's mutation chain.
         * @enum {string}
         */
        Mutation: "adaptive" | "translate" | "code_mix" | "romanize" | "script_switch" | "roleplay_wrap" | "translation_wrap" | "tts";
        /** RegressionCaseOut */
        RegressionCaseOut: {
            /** Base Test Case Id */
            base_test_case_id: number;
            category: components["schemas"]["AttackCategory"];
            language: components["schemas"]["LanguageCode"];
            variant: components["schemas"]["ScriptVariant"];
            /** Attack Text */
            attack_text: string;
            before_severity: components["schemas"]["Severity"];
            after_severity: components["schemas"]["Severity"] | null;
            /** Vulnerable Trials */
            vulnerable_trials: number;
            /** Trials */
            trials: number;
            outcome: components["schemas"]["RegressionOutcome"] | null;
            /**
             * Split
             * @description 'fix' = shown to the patch author; 'heldout' = never seen by it; null = not part of the fix
             */
            split: ("fix" | "heldout") | null;
        };
        /** RegressionCreate */
        RegressionCreate: {
            /**
             * Only Failed
             * @default true
             */
            only_failed: boolean;
            /**
             * Trials
             * @default 3
             */
            trials: number;
        };
        /** RegressionOut */
        RegressionOut: {
            /** Id */
            id: number;
            /** Base Campaign Id */
            base_campaign_id: number;
            /** New Campaign Id */
            new_campaign_id: number;
            status: components["schemas"]["CampaignStatus"];
            /** Trials */
            trials: number;
            /** Only Failed */
            only_failed: boolean;
            summary: components["schemas"]["RegressionSummary"];
            /** Cases */
            cases: components["schemas"]["RegressionCaseOut"][];
            /**
             * Fix Id
             * @description The auto-fix proposal this rerun verifies, if any
             */
            fix_id: number | null;
            /** Fix Summary */
            fix_summary: string | null;
            generalization: components["schemas"]["GeneralizationOut"] | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * RegressionOutcome
         * @enum {string}
         */
        RegressionOutcome: "fixed" | "still_vulnerable" | "flaky" | "new_vulnerability";
        /** RegressionSummary */
        RegressionSummary: {
            /**
             * Fixed
             * @default 0
             */
            fixed: number;
            /**
             * Still Vulnerable
             * @default 0
             */
            still_vulnerable: number;
            /**
             * Flaky
             * @default 0
             */
            flaky: number;
            /**
             * New Vulnerability
             * @default 0
             */
            new_vulnerability: number;
        };
        /** ResultDetail */
        ResultDetail: {
            /** Id */
            id: number;
            /** Campaign Id */
            campaign_id: number;
            /** Test Case Id */
            test_case_id: number;
            /** Trial */
            trial: number;
            category: components["schemas"]["AttackCategory"];
            language: components["schemas"]["LanguageCode"];
            variant: components["schemas"]["ScriptVariant"];
            modality: components["schemas"]["Modality"];
            /** Attack Text */
            attack_text: string;
            verdict: components["schemas"]["Verdict"];
            confidence: components["schemas"]["Confidence"] | null;
            severity: components["schemas"]["Severity"];
            /** Latency Ms */
            latency_ms: number | null;
            /** Mission Id */
            mission_id: string | null;
            /** Turn */
            turn: number | null;
            /** Tactic */
            tactic: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Technique */
            technique: string;
            /** Mutation Chain */
            mutation_chain: components["schemas"]["Mutation"][];
            /** English Gloss */
            english_gloss: string | null;
            /** Detected Language */
            detected_language: string | null;
            /** Detected Script */
            detected_script: string | null;
            /** Marker Token */
            marker_token: string | null;
            /** Http Status */
            http_status: number | null;
            /** Raw Response */
            raw_response: string;
            /** Extracted Reply */
            extracted_reply: string | null;
            /** Detector Hits */
            detector_hits: components["schemas"]["DetectorHit"][];
            /** Judge Rationale */
            judge_rationale: string | null;
            /** Attacker Note */
            attacker_note: string | null;
            /** Remediation */
            remediation: string | null;
            /** Audio Id */
            audio_id: string | null;
            /** Transcript */
            transcript: string | null;
            /** Transcript Drift */
            transcript_drift: number | null;
        };
        /** ResultPage */
        ResultPage: {
            /** Items */
            items: components["schemas"]["ResultSummary"][];
            /** Total */
            total: number;
            /** Offset */
            offset: number;
            /** Limit */
            limit: number;
        };
        /** ResultSummary */
        ResultSummary: {
            /** Id */
            id: number;
            /** Campaign Id */
            campaign_id: number;
            /** Test Case Id */
            test_case_id: number;
            /** Trial */
            trial: number;
            category: components["schemas"]["AttackCategory"];
            language: components["schemas"]["LanguageCode"];
            variant: components["schemas"]["ScriptVariant"];
            modality: components["schemas"]["Modality"];
            /** Attack Text */
            attack_text: string;
            verdict: components["schemas"]["Verdict"];
            confidence: components["schemas"]["Confidence"] | null;
            severity: components["schemas"]["Severity"];
            /** Latency Ms */
            latency_ms: number | null;
            /** Mission Id */
            mission_id: string | null;
            /** Turn */
            turn: number | null;
            /** Tactic */
            tactic: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * ScriptVariant
         * @enum {string}
         */
        ScriptVariant: "native" | "romanized" | "code_mixed";
        /** ScriptVariantOption */
        ScriptVariantOption: {
            value: components["schemas"]["ScriptVariant"];
            /** Label */
            label: string;
            /** Description */
            description: string;
        };
        /** SecurityBreakdown */
        SecurityBreakdown: {
            /** Total Tests */
            total_tests: number;
            /** Total Vulnerabilities */
            total_vulnerabilities: number;
            /**
             * Vulnerabilities Confirmed
             * @description Proven by a deterministic detector (canary, marker, PII, prompt overlap)
             */
            vulnerabilities_confirmed: number;
            /**
             * Vulnerabilities Likely
             * @description Decided by the Sarvam-105B judge (quoted evidence required)
             */
            vulnerabilities_likely: number;
            /** Pass Rate */
            pass_rate: number;
            severity_distribution: components["schemas"]["SeverityCounts"];
            /** By Language */
            by_language: components["schemas"]["LanguageStat"][];
            /** By Variant */
            by_variant: components["schemas"]["VariantStat"][];
            /** By Category */
            by_category: components["schemas"]["CategoryStat"][];
            /** Heatmap */
            heatmap: components["schemas"]["HeatmapCell"][];
        };
        /**
         * Severity
         * @enum {string}
         */
        Severity: "critical" | "high" | "medium" | "low" | "none";
        /** SeverityCounts */
        SeverityCounts: {
            /**
             * Critical
             * @default 0
             */
            critical: number;
            /**
             * High
             * @default 0
             */
            high: number;
            /**
             * Medium
             * @default 0
             */
            medium: number;
            /**
             * Low
             * @default 0
             */
            low: number;
            /**
             * None
             * @default 0
             */
            none: number;
        };
        /** SeverityOption */
        SeverityOption: {
            value: components["schemas"]["Severity"];
            /** Label */
            label: string;
            /** Rank */
            rank: number;
        };
        /** ShieldChatRequest */
        ShieldChatRequest: {
            /** Message */
            message: string;
        };
        /**
         * ShieldChatResponse
         * @description `reply` is what the user sees: the bot's answer, a redacted answer, or a polite refusal.
         */
        ShieldChatResponse: {
            /** Reply */
            reply: string;
            /**
             * Action
             * @enum {string}
             */
            action: "allowed" | "blocked_input" | "redacted_output" | "blocked_output";
            /** Reason */
            reason: string | null;
            /**
             * Language
             * @description Detected by Sarvam language ID, e.g. kn-IN
             */
            language: string | null;
            /** Script */
            script: string | null;
            /**
             * English
             * @description Sarvam Translate's English reading of the message
             */
            english: string | null;
            /**
             * Rule
             * @description Fast input rule that fired, if any
             */
            rule: string | null;
            /**
             * Category
             * @description Attack category from the Sarvam-105B classifier, if any
             */
            category: string | null;
            /** Latency Ms */
            latency_ms: number;
        };
        /**
         * ShieldComparison
         * @description Latest campaign against the bare target vs the latest one against the shielded target.
         */
        ShieldComparison: {
            /** Without Campaign Id */
            without_campaign_id: number | null;
            /** With Campaign Id */
            with_campaign_id: number | null;
            /**
             * Same Config
             * @description Both campaigns used the same mode, categories, languages and styles
             */
            same_config: boolean;
            /** Without Rate */
            without_rate: number | null;
            /** With Rate */
            with_rate: number | null;
            /** Without By Language */
            without_by_language: components["schemas"]["LanguageStat"][];
            /** With By Language */
            with_by_language: components["schemas"]["LanguageStat"][];
        };
        /** ShieldEventOut */
        ShieldEventOut: {
            /** Id */
            id: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Language */
            language: string | null;
            /** Script */
            script: string | null;
            /**
             * Action
             * @enum {string}
             */
            action: "allowed" | "blocked_input" | "redacted_output" | "blocked_output";
            /** Reason */
            reason: string | null;
            /** Rule */
            rule: string | null;
            /** Category */
            category: string | null;
            /** Message Excerpt */
            message_excerpt: string;
            /** English Excerpt */
            english_excerpt: string | null;
            /** Latency Ms */
            latency_ms: number;
        };
        /** ShieldLanguageStat */
        ShieldLanguageStat: {
            /** Language */
            language: string;
            /** Checked */
            checked: number;
            /**
             * Blocked
             * @description Inputs blocked + replies blocked or redacted
             */
            blocked: number;
        };
        /** ShieldOverview */
        ShieldOverview: {
            target: components["schemas"]["TargetOut"];
            /** @description The '<name> + Shield' target, once created */
            shield_target: components["schemas"]["TargetOut"] | null;
            stats: components["schemas"]["ShieldStats"];
            /** Recent */
            recent: components["schemas"]["ShieldEventOut"][];
            comparison: components["schemas"]["ShieldComparison"];
        };
        /** ShieldStats */
        ShieldStats: {
            /** Checked */
            checked: number;
            /** Allowed */
            allowed: number;
            /** Blocked Input */
            blocked_input: number;
            /** Redacted Output */
            redacted_output: number;
            /** Blocked Output */
            blocked_output: number;
            /** By Language */
            by_language: components["schemas"]["ShieldLanguageStat"][];
        };
        /** SynthesizeRequest */
        SynthesizeRequest: {
            /** Text */
            text: string;
            language: components["schemas"]["LanguageCode"];
            /** Speaker */
            speaker?: string | null;
        };
        /** TargetCreate */
        TargetCreate: {
            /** Name */
            name: string;
            /** @default text */
            kind: components["schemas"]["TargetKind"];
            /**
             * Base Url
             * @description Full endpoint URL the attack prompt is sent to
             */
            base_url: string;
            /** @default POST */
            method: components["schemas"]["HttpMethod"];
            /**
             * Body Template
             * @description JSON request body; must contain the `{{prompt}}` placeholder
             */
            body_template: string;
            /**
             * Response Path
             * @description Dotted path to the reply text, e.g. `choices.0.message.content`
             */
            response_path: string;
            /** Canary Strings */
            canary_strings?: string[];
            /** System Prompt Hint */
            system_prompt_hint?: string | null;
            /**
             * Fix Webhook Url
             * @description Optional: Chakravyuh POSTs a patched system prompt here ({system_prompt, addendum}) so fixes can be applied and verified in one click
             */
            fix_webhook_url?: string | null;
            /**
             * Legit Questions
             * @description Ordinary questions a real user of this app asks (English; translated per language). Used by the over-refusal check before/after a fix. Empty = the built-in banking set
             */
            legit_questions?: string[];
            /**
             * Headers
             * @description Request headers (e.g. auth). Stored server-side, never returned unmasked.
             */
            headers?: {
                [key: string]: string;
            };
            /**
             * Ownership Confirmed
             * @description User attests they own or are authorized to test this application
             * @constant
             */
            ownership_confirmed: true;
        };
        /**
         * TargetKind
         * @enum {string}
         */
        TargetKind: "text" | "voice";
        /** TargetList */
        TargetList: {
            /** Items */
            items: components["schemas"]["TargetOut"][];
        };
        /** TargetOut */
        TargetOut: {
            /** Id */
            id: number;
            /** Name */
            name: string;
            kind: components["schemas"]["TargetKind"];
            /** Base Url */
            base_url: string;
            method: components["schemas"]["HttpMethod"];
            /** Headers */
            headers: components["schemas"]["MaskedHeader"][];
            /** Body Template */
            body_template: string;
            /** Response Path */
            response_path: string;
            /** Canary Strings */
            canary_strings: string[];
            /** System Prompt Hint */
            system_prompt_hint: string | null;
            /** Fix Webhook Url */
            fix_webhook_url: string | null;
            /** Legit Questions */
            legit_questions: string[];
            /**
             * Shield For Target Id
             * @description Set when this target is a Chakravyuh Shield in front of another target
             */
            shield_for_target_id: number | null;
            verification_status: components["schemas"]["VerificationStatus"];
            /** Verification Token */
            verification_token: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** TargetUpdate */
        TargetUpdate: {
            /** Name */
            name: string;
            /** @default text */
            kind: components["schemas"]["TargetKind"];
            /**
             * Base Url
             * @description Full endpoint URL the attack prompt is sent to
             */
            base_url: string;
            /** @default POST */
            method: components["schemas"]["HttpMethod"];
            /**
             * Body Template
             * @description JSON request body; must contain the `{{prompt}}` placeholder
             */
            body_template: string;
            /**
             * Response Path
             * @description Dotted path to the reply text, e.g. `choices.0.message.content`
             */
            response_path: string;
            /** Canary Strings */
            canary_strings?: string[];
            /** System Prompt Hint */
            system_prompt_hint?: string | null;
            /**
             * Fix Webhook Url
             * @description Optional: Chakravyuh POSTs a patched system prompt here ({system_prompt, addendum}) so fixes can be applied and verified in one click
             */
            fix_webhook_url?: string | null;
            /**
             * Legit Questions
             * @description Ordinary questions a real user of this app asks (English; translated per language). Used by the over-refusal check before/after a fix. Empty = the built-in banking set
             */
            legit_questions?: string[];
            /**
             * Headers
             * @description Omit or null to keep existing headers; provide a map to replace them
             */
            headers?: {
                [key: string]: string;
            } | null;
        };
        /** TestConnectionRequest */
        TestConnectionRequest: {
            /**
             * Prompt
             * @default Hello! What can you help me with?
             */
            prompt: string;
        };
        /** TestConnectionResponse */
        TestConnectionResponse: {
            /** Ok */
            ok: boolean;
            /** Http Status */
            http_status: number | null;
            /** Latency Ms */
            latency_ms: number | null;
            /** Extracted Reply */
            extracted_reply: string | null;
            /** Raw Response Preview */
            raw_response_preview: string;
            /** Error */
            error: string | null;
        };
        /**
         * TextSpan
         * @description Character offsets into `extracted_reply` to highlight as evidence.
         */
        TextSpan: {
            /** Start */
            start: number;
            /** End */
            end: number;
        };
        /** VariantStat */
        VariantStat: {
            variant: components["schemas"]["ScriptVariant"];
            /** Total */
            total: number;
            /** Vulnerable */
            vulnerable: number;
            /** Vulnerability Rate */
            vulnerability_rate: number;
        };
        /**
         * Verdict
         * @enum {string}
         */
        Verdict: "vulnerable" | "safe" | "inconclusive" | "error";
        /**
         * VerificationMethod
         * @enum {string}
         */
        VerificationMethod: "token_file" | "allowlisted_host";
        /**
         * VerificationStatus
         * @enum {string}
         */
        VerificationStatus: "unverified" | "verified";
        /** VerifyTargetResponse */
        VerifyTargetResponse: {
            verification_status: components["schemas"]["VerificationStatus"];
            method: components["schemas"]["VerificationMethod"] | null;
            /** Message */
            message: string;
        };
        /** VoiceComparisonOut */
        VoiceComparisonOut: {
            /** Base Campaign Id */
            base_campaign_id: number;
            /** Voice Campaign Id */
            voice_campaign_id: number;
            /**
             * Text Baseline
             * @description 'fresh' = the text version was re-sent alongside the voice one and judged identically (fair comparison); 'original' = older replay compared against the original campaign's verdicts
             * @enum {string}
             */
            text_baseline: "fresh" | "original";
            /**
             * Pairs
             * @description Attacks with a usable result in both modalities
             */
            pairs: number;
            /** Text Succeeded */
            text_succeeded: number;
            /** Voice Succeeded */
            voice_succeeded: number;
            /** Both */
            both: number;
            /**
             * Text Only
             * @description Succeeded as text, failed when spoken
             */
            text_only: number;
            /**
             * Voice Only
             * @description Failed as text, succeeded when spoken
             */
            voice_only: number;
            /** Mean Transcript Drift */
            mean_transcript_drift: number | null;
            /** By Language */
            by_language: components["schemas"]["VoiceLanguageDelta"][];
            /** Items */
            items: components["schemas"]["VoicePair"][];
        };
        /** VoiceLanguageDelta */
        VoiceLanguageDelta: {
            language: components["schemas"]["LanguageCode"];
            /** Pairs */
            pairs: number;
            /** Text Succeeded */
            text_succeeded: number;
            /** Voice Succeeded */
            voice_succeeded: number;
        };
        /**
         * VoicePair
         * @description The SAME attack sent as text and as speech.
         */
        VoicePair: {
            language: components["schemas"]["LanguageCode"];
            category: components["schemas"]["AttackCategory"];
            /** Text Result Id */
            text_result_id: number;
            /** Voice Result Id */
            voice_result_id: number;
            text_verdict: components["schemas"]["Verdict"];
            voice_verdict: components["schemas"]["Verdict"];
            /** Transcript Drift */
            transcript_drift: number | null;
        };
        /** VoiceReplayRequest */
        VoiceReplayRequest: {
            /**
             * Max Attacks
             * @default 10
             */
            max_attacks: number;
        };
        /** VoiceTestRequest */
        VoiceTestRequest: {
            /** Audio Id */
            audio_id: string;
            /** Target Id */
            target_id: number;
            category: components["schemas"]["AttackCategory"];
            /** @description Spoken language; null lets Sarvam STT auto-detect */
            language?: components["schemas"]["LanguageCode"] | null;
            /**
             * Intended Text
             * @description What the attacker meant to say (for drift)
             */
            intended_text?: string | null;
            /**
             * Code Mixed
             * @default false
             */
            code_mixed: boolean;
        };
        /** VoiceTestResponse */
        VoiceTestResponse: {
            /** Transcript */
            transcript: string;
            /** Detected Language */
            detected_language: string | null;
            /** Transcript Drift */
            transcript_drift: number | null;
            result: components["schemas"]["ResultDetail"];
        };
        /** WrapperOption */
        WrapperOption: {
            value: components["schemas"]["AttackWrapper"];
            /** Label */
            label: string;
            /** Description */
            description: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getMetaEnums: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MetaEnumsResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listTargets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetList"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createTarget: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TargetCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getTarget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    updateTarget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TargetUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    deleteTarget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    verifyTarget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VerifyTargetResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    testTargetConnection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TestConnectionRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TestConnectionResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listAttackTemplates: {
        parameters: {
            query?: {
                category?: components["schemas"]["AttackCategory"] | null;
                language?: components["schemas"]["LanguageCode"] | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttackTemplateList"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    previewAttack: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttackPreviewRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttackPreviewResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    generateAttackParaphrases: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttackGenerateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttackGenerateResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    estimateCampaign: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignEstimateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignEstimateResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCampaigns: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignList"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createCampaign: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CampaignCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCampaign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancelCampaign: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCampaignResults: {
        parameters: {
            query?: {
                severity?: components["schemas"]["Severity"] | null;
                language?: components["schemas"]["LanguageCode"] | null;
                category?: components["schemas"]["AttackCategory"] | null;
                verdict?: components["schemas"]["Verdict"] | null;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultPage"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createRegression: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegressionCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RegressionOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCampaignLive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignLiveOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getCampaignReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignReport"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCampaignMissions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MissionList"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listCampaignFixes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixList"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    proposeFix: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixProposalOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getFix: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                fix_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixProposalOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    applyFix: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                fix_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FixApplyRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FixProposalOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getHardeningTimeline: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HardeningOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getResult: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                result_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultDetail"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    synthesizeVoice: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SynthesizeRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AudioAssetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    uploadVoice: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_uploadVoice"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AudioAssetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    startVoiceReplay: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoiceReplayRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CampaignOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getVoiceComparison: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                campaign_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceComparisonOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    runVoiceTest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoiceTestRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceTestResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getVoiceAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                audio_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "audio/wav": unknown;
                    "audio/webm": unknown;
                    "audio/mpeg": unknown;
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getRegression: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                regression_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RegressionOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getDashboardSummary: {
        parameters: {
            query?: {
                campaign_id?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardSummary"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    shieldChat: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShieldChatRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShieldChatResponse"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    protectTarget: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetOut"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getShieldOverview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShieldOverview"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    runFalseBlockCheck: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                target_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FalseBlockRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FalseBlockResult"];
                };
            };
            /** @description Client error */
            "4XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Server error */
            "5XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
