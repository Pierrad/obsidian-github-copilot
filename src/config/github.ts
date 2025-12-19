export default {
	RELEASE_URL: (version: string) =>
		`https://github.com/github/copilot-language-server-release/releases/download/${version}/copilot-language-server-js-${version}.zip`,
};
