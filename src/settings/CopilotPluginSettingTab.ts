import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import CopilotPlugin from "../main";
import * as child_process from "child_process";

export interface SettingsObserver {
	updateSettings(): void;
}

export interface CopilotPluginSettings {
	nodePath: string;
	enabled: boolean;
}

export const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: "default",
	enabled: true,
};

class CopilotPluginSettingTab extends PluginSettingTab {
	plugin: CopilotPlugin;
	private observers: SettingsObserver[] = [];

	constructor(app: App, plugin: CopilotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Node binary path")
			.setDesc(
				"The path to your node binary (at least Node v18). This is used to run the copilot server.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the path to your node binary.")
					.setValue(this.plugin.settings.nodePath)
					.onChange(async (value) => {
						this.plugin.settings.nodePath = value;
						await this.saveSettings();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText("Test the path")
					.onClick(async () => this.testNodePath()),
			);

		new Setting(containerEl)
			.setName("Enable copilot")
			.setDesc(
				"Enable or disable the copilot agent. This setting can be managed from the bottom status bar like in IDEs.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.saveSettings();
					}),
			);
	}

	public registerObserver(observer: SettingsObserver) {
		this.observers.push(observer);
	}

	private notifyObservers() {
		for (const observer of this.observers) {
			observer.updateSettings();
		}
	}

	public async loadSettings() {
		this.plugin.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData(),
		);
	}

	public async saveSettings(notify = true) {
		await this.plugin.saveData(this.plugin.settings);
		if (notify) this.notifyObservers();
	}

	public isCopilotEnabled(): boolean {
		return this.plugin.settings.enabled;
	}

	public async testNodePath(): Promise<void> {
		const nodePath = this.plugin.settings.nodePath;

		try {
			const result = await new Promise<string>((resolve, reject) => {
				const nodeProcess = child_process.spawn(nodePath, [
					"--version",
				]);
				let output = "";

				nodeProcess.stdout.on("data", (data) => {
					output += data.toString();
				});

				nodeProcess.on("close", (code) => {
					if (code === 0) {
						resolve(output.trim());
					} else {
						reject(
							new Error(`Node process exited with code ${code}`),
						);
					}
				});

				nodeProcess.on("error", (err) => {
					reject(err);
				});
			});

			const nodeVersion = result.slice(1);
			const requiredVersion = 18;

			if (parseFloat(nodeVersion) >= requiredVersion) {
				new Notice(
					`Node.js path is valid and the version ${nodeVersion} is compatible.`,
				);
			} else {
				new Notice(
					`Node.js path is valid, but the version ${nodeVersion} is not compatible. Please use Node.js v${requiredVersion} or later.`,
				);
			}
		} catch (err) {
			new Notice(`Error while testing the Node.js path: ${err.message}`);
		}
	}
}

export default CopilotPluginSettingTab;
