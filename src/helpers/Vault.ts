import { App, FileSystemAdapter } from "obsidian";

class Vault {
	public getBasePath(app: App): string {
		let basePath;
		if (app.vault.adapter instanceof FileSystemAdapter) {
			basePath = app.vault.adapter.getBasePath();
		} else {
			throw new Error("Cannot determine base path.");
		}
		return `${basePath}`;
	}

	public getPluginPath(app: App): string {
		return `${this.getBasePath(app)}/.obsidian/plugins/github-copilot`;
	}
}

export default Vault;
