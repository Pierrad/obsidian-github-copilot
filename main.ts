import { App, Plugin, PluginSettingTab, Setting, FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { LspClient, JSONRPCEndpoint } from "@pierrad/ts-lsp-client"
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import EventListener from './src/EventListener';

interface CopilotPluginSettings {
	nodePath: string;
}

const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: 'default'
}

export default class CopilotPlugin extends Plugin {
	settings: CopilotPluginSettings;
	copilotAgent: ChildProcessWithoutNullStreams;
	endpoint: JSONRPCEndpoint;
	client: LspClient;

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
		const eventListener = new EventListener();
		const basePath = this.getBasePath();

		console.log('Copilot plugin loaded', basePath)

		const agentPath = path.join(basePath, '/.obsidian/plugins/github-copilot/copilot/agent.js');

		console.log('Agent path:', agentPath)

		this.registerEvent(this.app.workspace.on('file-open', eventListener.onFileOpen));
		this.registerEvent(this.app.workspace.on('editor-change', eventListener.onEditorChange));

		this.addSettingTab(new CopilotPluginSettingTab(this.app, this));

		this.copilotAgent = spawn(
			this.settings.nodePath,
			[agentPath, '--stdio'],
			{
				shell: true,
				stdio: 'pipe'
			}
		);
	
		this.copilotAgent.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});
	
		this.copilotAgent.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});
	
		this.copilotAgent.on('exit', (code, signal) => {
			console.log(`Process exited with code ${code} and signal ${signal}`);
		});

		this.endpoint = new JSONRPCEndpoint(
			this.copilotAgent.stdin,
			this.copilotAgent.stdout,
		);
	

		this.client = new LspClient(this.endpoint);
	
		const result = await this.client.initialize({
			processId: this.copilotAgent.pid as number,
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
	
		console.log('initialization result : ', result);
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
