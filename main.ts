import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CopilotPluginSettings {
	nodePath: string;
}

const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: 'default'
}

export default class CopilotPlugin extends Plugin {
	settings: CopilotPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: CopilotPlugin;

	constructor(app: App, plugin: CopilotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Node Path')
			.setDesc('The path to your node binary. This is used to run the copilot server.')
			.addText(text => text
				.setPlaceholder('Enter the path to your node binary.')
				.setValue(this.plugin.settings.nodePath)
				.onChange(async (value) => {
					this.plugin.settings.nodePath = value;
					await this.plugin.saveSettings();
				}));
	}
}
