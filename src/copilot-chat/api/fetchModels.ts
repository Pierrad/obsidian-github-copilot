import { requestUrl, RequestUrlResponse } from "obsidian";
import Logger from "../../helpers/Logger";
import {
	canonicalizeModelValue,
	formatModelLabel,
	getModelDisplayLabel,
	isSupportedChatModelValue,
	ModelOption,
	sortModels,
} from "../models";

interface CopilotModelResponse {
	id?: string;
	name?: string;
	display_name?: string;
}

interface CopilotModelsResponse {
	data?: CopilotModelResponse[];
	models?: CopilotModelResponse[];
	items?: CopilotModelResponse[];
}

const extractModels = (response: unknown): CopilotModelResponse[] => {
	if (Array.isArray(response)) {
		return response.map((entry) =>
			typeof entry === "string" ? { id: entry } : (entry as CopilotModelResponse),
		);
	}

	if (!response || typeof response !== "object") {
		return [];
	}

	const payload = response as CopilotModelsResponse & Record<string, unknown>;
	const collection = [payload.data, payload.models, payload.items].find(
		(value) => Array.isArray(value),
	);
	if (Array.isArray(collection)) {
		return collection;
	}

	return [];
};

const toModelOptions = (response: unknown): ModelOption[] => {
	const models = extractModels(response);

	const dedupedModels = new Map<string, ModelOption>();

	for (const model of models) {
		const modelId = model?.id || model?.name || model?.display_name;
		if (!modelId) {
			continue;
		}

		if (!isSupportedChatModelValue(modelId)) {
			continue;
		}

		const canonicalValue = canonicalizeModelValue(modelId);

		const discoveredModel: ModelOption = {
			label: formatModelLabel(canonicalValue),
			value: canonicalValue,
		};

		dedupedModels.set(canonicalValue, {
			...discoveredModel,
			label:
				model.display_name ||
				model.name ||
				getModelDisplayLabel(discoveredModel),
		});
	}

	return sortModels(Array.from(dedupedModels.values()));
};

export const fetchModels = async (
	accessToken: string,
): Promise<ModelOption[]> => {
	try {
		const response: RequestUrlResponse = await requestUrl({
			url: "https://api.githubcopilot.com/models",
			method: "GET",
			headers: {
				Accept: "application/json",
				"editor-version": "vscode/1.80.1",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (response.status !== 200) {
			throw new Error(`Failed to fetch models: ${response.status}`);
		}

		return toModelOptions(await response.json);
	} catch (error) {
		Logger.getInstance().error(`Error fetching models: ${error}`);
		throw new Error("Failed to fetch models");
	}
};