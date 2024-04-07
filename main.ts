import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as path from 'path';
import { JSONRPCEndpoint } from "@pierrad/ts-lsp-client"
import { debounce } from 'obsidian';
import EventListener from './src/EventListener';
import Agent from './src/copilot/Agent';
import Client from './src/copilot/Client';
import Vault from './src/Vault';

interface CopilotPluginSettings {
	nodePath: string;
}

const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: 'default'
}

export default class CopilotPlugin extends Plugin {
	settings: CopilotPluginSettings;
	agent: Agent;

	async onload() {
		await this.loadSettings();
		const eventListener = new EventListener();
		const vault = new Vault();
		const basePath = vault.getBasePath(this.app);
		const agentPath = path.join(basePath, '/.obsidian/plugins/github-copilot/copilot/agent.js');

		this.agent = new Agent();
		this.agent.startAgent(this.settings.nodePath, agentPath);
		this.agent.logger();

		const client = Client.getInstance();
		client.configure(new JSONRPCEndpoint(this.agent.getAgent().stdin, this.agent.getAgent().stdout));
		await client.initialize({
			processId: this.agent.getAgent().pid as number,
			capabilities: {
				// @ts-expect-error - we're not using all the capabilities
				copilot: {
					openURL: true
				}
			},
			clientInfo: {
				name: 'ObsidianCopilot',
				version: '0.0.1'
			},
			rootUri: 'file://' + basePath,
			initializationOptions: {}
		});
		await client.checkStatus();
		await client.setEditorInfo(this.app, basePath);

		this.registerEvent(this.app.workspace.on('file-open', async (file) => eventListener.onFileOpen(file, basePath, client)));
		this.registerEvent(
			this.app.workspace.on(
				'editor-change',
				debounce(async (editor, info) => eventListener.onEditorChange(editor, info, basePath, client), 1000, true)
			)
		);
		this.registerEvent(this.app.vault.on('modify', async (file) => eventListener.onFileModify(file, basePath, client), this));
		this.addSettingTab(new CopilotPluginSettingTab(this.app, this));
	}

	onunload() {
		this.agent.stopAgent();
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
