import { requestUrl, RequestUrlResponse } from "obsidian";

export interface PATResponse {
	access_token: string;
	token_type: string;
	scope: string;
}

/**
 * Fetch a Personal Access Token using the device code
 * @param deviceCode The device code obtained from fetchDeviceCode
 * @returns Promise with the PAT data
 */
export const fetchPAT = async (deviceCode: string): Promise<PATResponse> => {
	const response: RequestUrlResponse = await requestUrl({
		url: "https://github.com/login/oauth/access_token",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			accept: "application/json",
			"editor-version": "Neovim/0.6.1",
			"editor-plugin-version": "copilot.vim/1.16.0",
			"user-agent": "GithubCopilot/1.155.0",
			"accept-encoding": "gzip, deflate, br",
		},
		body: JSON.stringify({
			client_id: "Iv1.b507a08c87ecfe98",
			device_code: deviceCode,
			grant_type: "urn:ietf:params:oauth:grant-type:device_code",
		}),
	});

	if (response.status !== 200) {
		throw new Error(`Failed to fetch PAT: ${response.status}`);
	}

	return await response.json;
};
