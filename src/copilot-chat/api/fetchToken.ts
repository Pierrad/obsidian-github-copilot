import { requestUrl, RequestUrlResponse } from "obsidian";

export interface TokenResponse {
	annotations_enabled: boolean;
	chat_enabled: boolean;
	chat_jetbrains_enabled: boolean;
	code_quote_enabled: boolean;
	code_review_enabled: boolean;
	codesearch: boolean;
	copilotignore_enabled: boolean;
	endpoints: {
			api: string;
			"origin-tracker": string;
			telemetry: string;
		};
	expires_at: number;
	individual: boolean;
	limited_user_quotas: null;
	limited_user_reset_date: null;
	nes_enabled: boolean;
	prompt_8k: boolean;
	public_suggestions: string;
	refresh_in: number;
	sku: string;
	snippy_load_test_enabled: boolean;
	telemetry: string;
	token: string;
	tracking_id: string;
	vsc_electron_fetcher_v2: boolean;
	xcode: boolean;
	xcode_chat: boolean;
}

/**
 * Fetch a Copilot access token using the Personal Access Token
 * @param pat The Personal Access Token obtained from GitHub
 * @returns Promise with the token data
 */
export const fetchToken = async (pat: string): Promise<TokenResponse> => {
	const response: RequestUrlResponse = await requestUrl({
		url: "https://api.github.com/copilot_internal/v2/token",
		method: "GET",
		headers: {
			authorization: `token ${pat}`,
			"editor-version": "Neovim/0.6.1",
			"editor-plugin-version": "copilot.vim/1.16.0",
			"user-agent": "GithubCopilot/1.155.0",
		},
	});

	if (response.status !== 200) {
		throw new Error(`Failed to fetch token: ${response.status}`);
	}

	return await response.json;
};
