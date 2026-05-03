export const DEFAULT_GITHUB_HOSTNAME = "github.com";

/**
 * Normalize a user-provided hostname by stripping protocol and trailing slashes.
 */
export const normalizeHostname = (hostname: string): string => {
	return hostname.replace(/^https?:\/\//, "").replace(/\/+$/, "");
};

export const getDeviceCodeUrl = (hostname?: string): string => {
	const host = hostname || DEFAULT_GITHUB_HOSTNAME;
	return `https://${host}/login/device/code`;
};

export const getOAuthAccessTokenUrl = (hostname?: string): string => {
	const host = hostname || DEFAULT_GITHUB_HOSTNAME;
	return `https://${host}/login/oauth/access_token`;
};

export const getCopilotTokenUrl = (hostname?: string): string => {
	const host = hostname || DEFAULT_GITHUB_HOSTNAME;
	return `https://api.${host}/copilot_internal/v2/token`;
};

export const getFallbackChatApiBaseUrl = (hostname?: string): string => {
	const host = hostname || DEFAULT_GITHUB_HOSTNAME;
	if (host === DEFAULT_GITHUB_HOSTNAME) {
		return "https://api.githubcopilot.com";
	}
	return `https://copilot.${host}`;
};
