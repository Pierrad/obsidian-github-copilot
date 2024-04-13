import { Plugin } from "obsidian";
import * as path from "path";
import { JSONRPCEndpoint } from "@pierrad/ts-lsp-client";
import { debounce } from "obsidian";

import EventListener from "./EventListener";
import Agent from "./copilot/Agent";
import Client from "./copilot/Client";
import Vault from "./helpers/Vault";
import { inlineSuggestionPlugin } from "./extensions/InlineSuggestionPlugin";
import { inlineSuggestionField } from "./extensions/InlineSuggestionState";
import { inlineSuggestionKeyWatcher } from "./extensions/InlineSuggestionKeyWatcher";
import StatusBar from "./status/StatusBar";
import CopilotPluginSettingTab, {
	CopilotPluginSettings,
	DEFAULT_SETTINGS,
} from "./settings/CopilotPluginSettingTab";

export default class CopilotPlugin extends Plugin {
	settings: CopilotPluginSettings;
	agent: Agent;
	statusBar: StatusBar | null;

	async onload() {
		await this.loadSettings();
		const eventListener = new EventListener();
		const vault = new Vault();
		const basePath = vault.getBasePath(this.app);
		const agentPath = path.join(
			basePath,
			"/.obsidian/plugins/github-copilot/copilot/agent.js",
		);

		this.agent = new Agent();
		this.agent.startAgent(this.settings.nodePath, agentPath);
		this.agent.logger();

		const client = Client.getInstance();
		client.configure(
			new JSONRPCEndpoint(
				this.agent.getAgent().stdin,
				this.agent.getAgent().stdout,
			),
		);
		await client.initialize({
			processId: this.agent.getAgent().pid as number,
			capabilities: {
				// @ts-expect-error - we're not using all the capabilities
				copilot: {
					openURL: true,
				},
			},
			clientInfo: {
				name: "ObsidianCopilot",
				version: "0.0.1",
			},
			rootUri: "file://" + basePath,
			initializationOptions: {},
		});
		await client.checkStatus();
		await client.setEditorInfo(this.app, basePath);

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) =>
				eventListener.onFileOpen(file, basePath, client),
			),
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(
					async (editor, info) =>
						eventListener.onEditorChange(
							editor,
							info,
							basePath,
							client,
						),
					1000,
					true,
				),
			),
		);
		this.addSettingTab(new CopilotPluginSettingTab(this.app, this));
		this.registerEditorExtension([
			inlineSuggestionKeyWatcher,
			inlineSuggestionField,
			inlineSuggestionPlugin,
		]);

		this.statusBar = new StatusBar(this);
	}

	onunload() {
		this.agent.stopAgent();
		this.statusBar = null;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
