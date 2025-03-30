import { requestUrl, RequestUrlResponse } from "obsidian";

export interface SendMessageRequest {
	intent: boolean;
	model: string;
	temperature: number;
	top_p: number;
	n: number;
	stream: boolean;
	messages: {
		content: string;
		role: "user" | "assistant";
	}[];
}

export interface SendMessageResponse {
	choices: {
		content_filter_results: {
			hate: {
				filtered: boolean;
				severity: string;
			};
			self_harm: {
				filtered: boolean;
				severity: string;
			};
			sexual: {
				filtered: boolean;
				severity: string;
			};
			violence: {
				filtered: boolean;
				severity: string;
			};
		};
		finish_reason: string;
		index: number;
		message: {
			content: string;
			role: string;
		};
	}[];
	created: number;
	id: string;
	model: string;
	prompt_filter_results: {
		content_filter_results: {
			hate: {
				filtered: boolean;
				severity: string;
			};
			self_harm: {
				filtered: boolean;
				severity: string;
			};
			sexual: {
				filtered: boolean;
				severity: string;
			};
			violence: {
				filtered: boolean;
				severity: string;
			};
		};
		prompt_index: number;
	}[];
	system_fingerprint: string;
	usage: {
		completion_tokens: number;
		completion_tokens_details: {
			accepted_prediction_tokens: number;
			audio_tokens: number;
			reasoning_tokens: number;
			rejected_prediction_tokens: number;
		};
		prompt_tokens: number;
		prompt_tokens_details: {
			audio_tokens: number;
			cached_tokens: number;
		};
		total_tokens: number;
	};
}

/**
 * Send a message to the GitHub Copilot API
 * @param data The message data to send
 * @param accessToken The access token for authentication
 * @returns Promise with the response data
 */
export const sendMessage = async (
	data: SendMessageRequest,
	accessToken: string,
): Promise<SendMessageResponse> => {
	try {
		console.log("Sending message to GitHub Copilot API:", data);
		console.log("Access Token:", accessToken);
		const response: RequestUrlResponse = await requestUrl({
			url: "https://api.githubcopilot.com/chat/completions",
			method: "POST",
			headers: {
				Accept: "*/*",
				"editor-version": "vscode/1.80.1",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(data),
		});

		if (response.status !== 200) {
			throw new Error(`Failed to fetch PAT: ${response.status}`);
		}

		return await response.json;
	} catch (error) {
		console.error("Error sending message:", error);
		throw new Error("Failed to send message");
	}
};
