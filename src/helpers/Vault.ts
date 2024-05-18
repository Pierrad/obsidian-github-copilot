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

	public static getCopilotPath(app: App): string {
		return `${this.getPluginPath(app)}/copilot`;
	}

	public static getCopilotResourcesPath(app: App): string {
		return `${this.getCopilotPath(app)}/resources/cl100k/`;
	}

	public static getAgentPath(app: App): string {
		return `${this.getCopilotPath(app)}/agent.js`;
	}

	public static getTokenizerPath(app: App): string {
		return `${this.getCopilotResourcesPath(app)}/tokenizer_cushman002.json`;
	}

	public static getVocabPath(app: App): string {
		return `${this.getCopilotResourcesPath(app)}/vocab_cushman002.bpe`;
	}
}

export default Vault;
