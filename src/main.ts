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
} from "./settings/CopilotPluginSettingTab";

export default class CopilotPlugin extends Plugin {
	settingsTab: CopilotPluginSettingTab;
	settings: CopilotPluginSettings;
	statusBar: StatusBar | null;
	agent: Agent;
	client: Client;

	async onload() {
		this.settingsTab = new CopilotPluginSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.settingsTab.loadSettings();

		const vault = new Vault();
		const eventListener = new EventListener(this);
		const basePath = vault.getBasePath(this.app);
		const agentPath = path.join(
			basePath,
			"/.obsidian/plugins/github-copilot/copilot/agent.js",
		);

		this.agent = new Agent();
		this.agent.startAgent(this.settings.nodePath, agentPath);
		this.agent.logger();

		this.client = Client.getInstance();
		this.client.configure(
			new JSONRPCEndpoint(
				this.agent.getAgent().stdin,
				this.agent.getAgent().stdout,
			),
		);
		await this.client.initialize({
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
		await this.client.checkStatus();
		await this.client.setEditorInfo(this.app, basePath);

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) =>
				eventListener.onFileOpen(file),
			),
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(
					async (editor, info) =>
						eventListener.onEditorChange(editor, info),
					1000,
					true,
				),
			),
		);

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
}
