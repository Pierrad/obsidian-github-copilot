export type ReasoningEffort = "low" | "medium" | "high";

export interface ModelOption {
	label: string;
	value: string;
	multiplier?: string;
	tier?: "Medium" | "High" | "Xhigh";
	preview?: boolean;
	supportsReasoningEffort?: boolean;
}

export interface ModelGroup {
	label: string;
	models: ModelOption[];
}

const modelLabelOverrides: Record<string, string> = {
	"gpt-4o": "GPT-4o",
	"gpt-4.1": "GPT-4.1",
	"gpt-5-mini": "GPT-5 mini",
	"gpt-5.1": "GPT-5.1",
	"gpt-5.1-codex": "GPT-5.1-Codex",
	"gpt-5.1-codex-mini": "GPT-5.1-Codex-Mini",
	"gpt-5.1-codex-max": "GPT-5.1-Codex-Max",
	"gpt-5.2": "GPT-5.2",
	"gpt-5.2-codex": "GPT-5.2-Codex",
	"gpt-5.3-codex": "GPT-5.3-Codex",
	"gpt-5.4": "GPT-5.4",
	"gpt-5.4-mini": "GPT-5.4 mini",
	"claude-haiku-4.5": "Claude Haiku 4.5",
	"claude-sonnet-4": "Claude Sonnet 4",
	"claude-sonnet-4.5": "Claude Sonnet 4.5",
	"claude-sonnet-4.6": "Claude Sonnet 4.6",
	"claude-opus-4.5": "Claude Opus 4.5",
	"claude-opus-4.6": "Claude Opus 4.6",
	"claude-opus-4.6-fast": "Claude Opus 4.6 (fast mode)",
	"gemini-2.5-pro": "Gemini 2.5 Pro",
	"gemini-3-flash-preview": "Gemini 3 Flash",
	"gemini-3-pro-preview": "Gemini 3 Pro",
	"gemini-3.1-pro-preview": "Gemini 3.1 Pro",
	"grok-code-fast-1": "Grok Code Fast 1",
	"raptor-mini": "Raptor mini",
	"goldeneye": "Goldeneye",
};

const legacyModelAliases: Record<string, string> = {
	"gpt-4o-2024-08-06": "gpt-4o",
	"gpt-4.1-2025-04-14": "gpt-4.1",
	"gemini-3-pro": "gemini-3-pro-preview",
	"gemini-3-pro-preview": "gemini-3-pro-preview",
	"gemini-3-flash": "gemini-3-flash-preview",
	"gemini-3-flash-preview": "gemini-3-flash-preview",
	"gemini-3.1-pro": "gemini-3.1-pro-preview",
	"gemini-3.1-pro-preview": "gemini-3.1-pro-preview",
	"claude-opus-4.6-fast-mode": "claude-opus-4.6-fast",
	"claude-opus-4.6-fast-mode-preview": "claude-opus-4.6-fast",
	"claude-opus-4.6-fast-preview": "claude-opus-4.6-fast",
};

export const canonicalizeModelValue = (value: string): string => {
	return legacyModelAliases[value] || value;
};

export const defaultModels: ModelOption[] = [
	{ label: "GPT-4o", value: "gpt-4o", multiplier: "0x" },
	{ label: "GPT-4.1", value: "gpt-4.1", multiplier: "0x" },
	{
		label: "GPT-5 mini",
		value: "gpt-5-mini",
		multiplier: "0x",
		tier: "Medium",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.1",
		value: "gpt-5.1",
		multiplier: "1x",
		tier: "Medium",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.1-Codex",
		value: "gpt-5.1-codex",
		multiplier: "1x",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.1-Codex-Mini",
		value: "gpt-5.1-codex-mini",
		multiplier: "0.33x",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.1-Codex-Max",
		value: "gpt-5.1-codex-max",
		multiplier: "1x",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.2",
		value: "gpt-5.2",
		multiplier: "1x",
		tier: "Medium",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.2-Codex",
		value: "gpt-5.2-codex",
		multiplier: "1x",
		tier: "Medium",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.3-Codex",
		value: "gpt-5.3-codex",
		multiplier: "1x",
		tier: "Xhigh",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.4",
		value: "gpt-5.4",
		multiplier: "1x",
		tier: "High",
		supportsReasoningEffort: true,
	},
	{
		label: "GPT-5.4 mini",
		value: "gpt-5.4-mini",
		multiplier: "0.33x",
		tier: "High",
		supportsReasoningEffort: true,
	},
	{ label: "Claude Haiku 4.5", value: "claude-haiku-4.5", multiplier: "0.33x" },
	{ label: "Claude Sonnet 4", value: "claude-sonnet-4", multiplier: "1x" },
	{ label: "Claude Sonnet 4.5", value: "claude-sonnet-4.5", multiplier: "1x" },
	{
		label: "Claude Sonnet 4.6",
		value: "claude-sonnet-4.6",
		multiplier: "1x",
		tier: "High",
	},
	{ label: "Claude Opus 4.5", value: "claude-opus-4.5", multiplier: "3x" },
	{
		label: "Claude Opus 4.6",
		value: "claude-opus-4.6",
		multiplier: "3x",
		tier: "High",
	},
	{
		label: "Claude Opus 4.6 (fast mode)",
		value: "claude-opus-4.6-fast",
		multiplier: "30x",
		tier: "High",
		preview: true,
	},
	{ label: "Gemini 2.5 Pro", value: "gemini-2.5-pro", multiplier: "1x" },
	{
		label: "Gemini 3 Flash",
		value: "gemini-3-flash-preview",
		multiplier: "0.33x",
		preview: true,
	},
	{
		label: "Gemini 3.1 Pro",
		value: "gemini-3.1-pro-preview",
		multiplier: "1x",
		preview: true,
	},
	{ label: "Grok Code Fast 1", value: "grok-code-fast-1", multiplier: "0.25x" },
	{
		label: "Raptor mini",
		value: "raptor-mini",
		multiplier: "0x",
		preview: true,
	},
	{
		label: "Goldeneye",
		value: "goldeneye",
		multiplier: "1x",
		preview: true,
	},
];

const knownChatModelValues = new Set(defaultModels.map((model) => model.value));

const featuredModelOrder = [
	"claude-opus-4.6",
	"claude-sonnet-4.6",
	"gpt-4o",
	"gpt-5.4",
	"gpt-5.4-mini",
];

const featuredModelValues = new Set(featuredModelOrder);
const catalogOrder = new Map(
	defaultModels.map((model, index) => [canonicalizeModelValue(model.value), index]),
);

export const DEFAULT_SELECTED_MODEL_VALUE = "gpt-5.2";
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";

export const getPreferredDefaultModel = (
	models: ModelOption[] = defaultModels,
): ModelOption => {
	return (
		models.find((model) => model.value === DEFAULT_SELECTED_MODEL_VALUE) ||
		models[0]
	);
};

export const formatModelLabel = (modelId: string): string => {
	if (modelLabelOverrides[modelId]) {
		return modelLabelOverrides[modelId];
	}

	return modelId
		.split("-")
		.map((part) => {
			if (part.toLowerCase() === "gpt") return "GPT";
			if (part.toLowerCase() === "claude") return "Claude";
			if (part.toLowerCase() === "gemini") return "Gemini";
			if (part.toLowerCase() === "grok") return "Grok";
			if (part.toLowerCase() === "code") return "Code";
			if (part.toLowerCase() === "fast") return "Fast";
			if (part.toLowerCase() === "mini") return "mini";
			if (part.toLowerCase() === "max") return "Max";
			if (part.toLowerCase() === "codex") return "Codex";
			if (/^\d/.test(part)) return part;

			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join(" ");
};

export const sortModels = (models: ModelOption[]): ModelOption[] => {
	return [...models].sort((left, right) =>
		left.label.localeCompare(right.label, undefined, {
			numeric: true,
			sensitivity: "base",
		}),
	);
};

export const mergeModelOptions = (
	knownModels: ModelOption[],
	discoveredModels: ModelOption[],
): ModelOption[] => {
	const merged = new Map<string, ModelOption>();

	for (const model of knownModels) {
		merged.set(canonicalizeModelValue(model.value), model);
	}

	for (const model of discoveredModels) {
		const normalizedValue = canonicalizeModelValue(model.value);
		const existing = merged.get(normalizedValue);

		if (existing) {
			merged.set(normalizedValue, {
				...existing,
				...model,
				value: existing.value,
				label: existing.label,
			});
			continue;
		}

		merged.set(normalizedValue, {
			...model,
			value: normalizedValue,
			label: model.label || formatModelLabel(normalizedValue),
		});
	}

	return sortModels(Array.from(merged.values()));
};

export const getModelDisplayLabel = (model: ModelOption): string => {
	return `${model.label}${model.preview ? " (Preview)" : ""}`;
};

export const getModelPickerLabel = (model: ModelOption): string => {
	const parts = [getModelDisplayLabel(model)];
	if (model.tier) {
		parts.push(model.tier);
	}
	if (model.multiplier) {
		parts.push(model.multiplier);
	}
	return parts.join(" - ");
};

export const getModelMetaSummary = (model: ModelOption): string => {
	const parts: string[] = [];
	if (model.tier) {
		parts.push(`Tier: ${model.tier}`);
	}
	if (model.multiplier) {
		parts.push(`Premium multiplier: ${model.multiplier}`);
	}
	if (model.preview) {
		parts.push("Preview");
	}
	return parts.join(" | ");
};

export const getModelCompactMeta = (model: ModelOption): string => {
	const parts: string[] = [];
	if (model.tier) {
		parts.push(model.tier);
	}
	if (model.multiplier) {
		parts.push(model.multiplier);
	}
	return parts.join(" · ");
};

export const formatReasoningEffortLabel = (effort: ReasoningEffort): string => {
	if (effort === "low") {
		return "Low";
	}

	if (effort === "high") {
		return "High";
	}

	return "Medium";
};

export const supportsReasoningEffort = (model: ModelOption): boolean => {
	return !!model.supportsReasoningEffort;
};

export const groupModelsForPicker = (models: ModelOption[]): ModelGroup[] => {
	const orderedModels = [...models].sort((left, right) => {
		const leftValue = canonicalizeModelValue(left.value);
		const rightValue = canonicalizeModelValue(right.value);
		const leftFeatured = featuredModelValues.has(leftValue);
		const rightFeatured = featuredModelValues.has(rightValue);

		if (leftFeatured && rightFeatured) {
			return (
				featuredModelOrder.indexOf(leftValue) -
				featuredModelOrder.indexOf(rightValue)
			);
		}

		if (leftFeatured !== rightFeatured) {
			return leftFeatured ? -1 : 1;
		}

		const leftOrder = catalogOrder.get(leftValue);
		const rightOrder = catalogOrder.get(rightValue);
		if (leftOrder !== undefined && rightOrder !== undefined) {
			return leftOrder - rightOrder;
		}

		if (leftOrder !== undefined) {
			return -1;
		}

		if (rightOrder !== undefined) {
			return 1;
		}

		return left.label.localeCompare(right.label, undefined, {
			numeric: true,
			sensitivity: "base",
		});
	});

	const featuredModels = orderedModels.filter((model) =>
		featuredModelValues.has(canonicalizeModelValue(model.value)),
	);
	const otherModels = orderedModels.filter(
		(model) => !featuredModelValues.has(canonicalizeModelValue(model.value)),
	);

	const groups: ModelGroup[] = [];
	if (featuredModels.length > 0) {
		groups.push({ label: "Featured models", models: featuredModels });
	}

	if (otherModels.length > 0) {
		groups.push({ label: "Other models", models: otherModels });
	}

	return groups;
};

export const isSupportedChatModelValue = (value: string): boolean => {
	const normalizedValue = canonicalizeModelValue(value);

	if (knownChatModelValues.has(normalizedValue)) {
		return true;
	}

	if (/embedding|ada|inference/i.test(normalizedValue)) {
		return false;
	}

	if (/^gpt-3\.5/i.test(normalizedValue)) {
		return false;
	}

	if (/^gpt-4($|-turbo)/i.test(normalizedValue)) {
		return false;
	}

	if (/^gpt-4o-mini$/i.test(normalizedValue)) {
		return false;
	}

	return /^(gpt-5([.-]|$)|claude(-|$)|gemini(-|$)|grok(-|$)|raptor(-|$)|goldeneye$|gpt-4o$|gpt-4\.1$)/i.test(
		normalizedValue,
	);
};

export const normalizeSelectedModel = (
	models: ModelOption[],
	selectedModel?: ModelOption,
): ModelOption | null => {
	if (!selectedModel) {
		return null;
	}

	const exactMatch = models.find(
		(model) => model.value === selectedModel.value,
	);
	if (exactMatch) {
		return exactMatch;
	}

	const aliasedValue = canonicalizeModelValue(selectedModel.value);
	if (aliasedValue) {
		const aliasMatch = models.find((model) => model.value === aliasedValue);
		if (aliasMatch) {
			return aliasMatch;
		}
	}

	const labelMatch = models.find(
		(model) => model.label.toLowerCase() === selectedModel.label.toLowerCase(),
	);
	return labelMatch || null;
};