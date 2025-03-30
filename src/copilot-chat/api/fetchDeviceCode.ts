import { requestUrl, RequestUrlResponse } from "obsidian";

export interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	expires_in: number;
	interval: number;
}

/**
 * Fetch a device code from GitHub's OAuth API
 * @returns Promise with the device code data
 */
export const fetchDeviceCode = async (): Promise<DeviceCodeResponse> => {
	const response: RequestUrlResponse = await requestUrl({
		url: "https://github.com/login/device/code",
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
			scope: "read:user",
		}),
	});

	if (response.status !== 200) {
		throw new Error(`Failed to fetch device code: ${response.status}`);
	}

	return await response.json;
};
