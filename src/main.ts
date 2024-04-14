import { Plugin } from "obsidian";
import { debounce } from "obsidian";

import EventListener from "./EventListener";
import CopilotAgent from "./copilot/CopilotAgent";
import Vault from "./helpers/Vault";
import StatusBar from "./status/StatusBar";
import CopilotPluginSettingTab, {
	CopilotPluginSettings,
} from "./settings/CopilotPluginSettingTab";
import { inlineSuggestionPlugin } from "./extensions/InlineSuggestionPlugin";
import { inlineSuggestionField } from "./extensions/InlineSuggestionState";
import { inlineSuggestionKeyWatcher } from "./extensions/InlineSuggestionKeyWatcher";

export default class CopilotPlugin extends Plugin {
	settingsTab: CopilotPluginSettingTab;
	settings: CopilotPluginSettings;
	statusBar: StatusBar | null;
	copilotAgent: CopilotAgent;

	async onload() {
		this.settingsTab = new CopilotPluginSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.settingsTab.loadSettings();

		this.statusBar = new StatusBar(this);

		const vault = new Vault();
		const eventListener = new EventListener(this);

		this.copilotAgent = new CopilotAgent(this, vault, false);
		if (this.settings.enabled) await this.copilotAgent.setup();

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) => {
				if (this.settings.enabled) eventListener.onFileOpen(file);
			}),
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(
					async (editor, info) => {
						if (this.settings.enabled) {
							eventListener.onEditorChange(editor, info);
						}
					},
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
	}

	onunload() {
		this.copilotAgent.stopAgent();
		this.statusBar = null;
	}
}
