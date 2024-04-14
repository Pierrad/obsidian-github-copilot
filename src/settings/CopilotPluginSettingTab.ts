import { App, PluginSettingTab, Setting } from "obsidian";
import CopilotPlugin from "../main";

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
			.setName("Node Path")
			.setDesc(
				"The path to your node binary. This is used to run the copilot server.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the path to your node binary.")
					.setValue(this.plugin.settings.nodePath)
					.onChange(async (value) => {
						this.plugin.settings.nodePath = value;
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Enable Copilot")
			.setDesc("Enable or disable the copilot plugin.")
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
}

export default CopilotPluginSettingTab;
