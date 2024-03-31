import { App, Plugin, PluginSettingTab, Setting, Notice, FileSystemAdapter } from 'obsidian';
import * as path from 'path';
// import * as fs from 'fs';
import { exec } from 'child_process';

interface CopilotPluginSettings {
	nodePath: string;
}

const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: 'default'
}

export default class CopilotPlugin extends Plugin {
	settings: CopilotPluginSettings;

	getBasePath(): string {
		let basePath;
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
				basePath = this.app.vault.adapter.getBasePath();
		} else {
				throw new Error('Cannot determine base path.');
		}
		return `${basePath}`;
}

	async onload() {
		await this.loadSettings();
		const basePath = this.getBasePath();


		this.addCommand({
      id: "execute-js-file",
      name: "Execute JS File",
      callback: () => {
				if (this.settings.nodePath === 'default') {
					new Notice('Please set the path to your node binary in the settings.');
					return;
				}

				exec(`${this.settings.nodePath} ${path.join(basePath, 'test.js')}`, (error, stdout, stderr) => {
					if (error) {
						new Notice(error.message);
						return;
					}

					if (stderr) {
						new Notice(stderr);
						return;
					}

					new Notice(stdout);
				});
      },
    });

		this.addSettingTab(new CopilotPluginSettingTab(this.app, this));
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

class CopilotPluginSettingTab extends PluginSettingTab {
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
