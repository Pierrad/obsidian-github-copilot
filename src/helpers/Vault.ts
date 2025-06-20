import { App, FileSystemAdapter } from "obsidian";

class Vault {
	public static DEFAULT_TAB_SIZE = 4;

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
		return `${this.getConfigPath(app)}/plugins/github-copilot-native`;
	}

	public static getCopilotPath(app: App, version: string): string {
		return `${this.getPluginPath(app)}/copilot-${version}`;
	}

	public static getCopilotResourcesPath(app: App, version: string): string {
		return `${this.getCopilotPath(app, version)}/resources`;
	}

	public static getAgentInitializerPath(app: App, version: string): string {
		return `${this.getCopilotPath(app, version)}/agent-initializer.cjs`;
	}

	public static getAgentPath(app: App, version: string): string {
		return `${this.getCopilotPath(app, version)}/main.js`;
	}

	public static isFileExcluded(filePath: string, exclude: string[]): boolean {
		return exclude.some((path) => filePath.includes(path));
	}

	public static getTabSize(app: App): number {
		return (
			// @ts-expect-error - getConfig is not typed
			(app.vault.getConfig("tabSize") as number) || this.DEFAULT_TAB_SIZE
		);
	}
}

export default Vault;
