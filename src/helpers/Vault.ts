import { App, FileSystemAdapter } from "obsidian";

class Vault {
	public static getBasePath(app: App): string {
		let basePath;
		if (app.vault.adapter instanceof FileSystemAdapter) {
			basePath = app.vault.adapter.getBasePath();
		} else {
			throw new Error("Cannot determine base path.");
		}
		return `${basePath}`;
	}

	public static getConfigPath(app: App): string {
		return `${this.getBasePath(app)}/${app.vault.configDir}`;
	}

	public static getPluginPath(app: App): string {
		return `${this.getConfigPath(app)}/plugins/github-copilot`;
	}

	public static getCopilotPath(app: App, version: string): string {
		return `${this.getPluginPath(app)}/copilot-${version}`;
	}

	public static getCopilotResourcesPath(app: App, version: string): string {
		return `${this.getCopilotPath(app, version)}/resources/cl100k/`;
	}

	public static getAgentPath(app: App, version: string): string {
		return `${this.getCopilotPath(app, version)}/agent.cjs`;
	}

	public static getTokenizerPath(app: App, version: string): string {
		return `${this.getCopilotResourcesPath(app, version)}/tokenizer_cushman002.json`;
	}

	public static getVocabPath(app: App, version: string): string {
		return `${this.getCopilotResourcesPath(app, version)}/vocab_cushman002.bpe`;
	}
}

export default Vault;
