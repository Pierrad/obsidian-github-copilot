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
import File from "./helpers/File";
import Logger from "./helpers/Logger";

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

		Logger.getInstance().setDebug(false);
		const vault = new Vault();
		const eventListener = new EventListener(this);

		if (!File.doesFolderExist(vault.getPluginPath(this.app) + "/copilot")) {
			await File.unzipFolder(
				vault.getPluginPath(this.app) + "/copilot.zip",
			);
		}

		this.registerEvent(
			this.app.workspace.on("file-open", async (file) => {
				if (this.settingsTab.isCopilotEnabled())
					eventListener.onFileOpen(file);
			}),
		);
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(
					async (editor, info) => {
						if (this.settingsTab.isCopilotEnabled())
							eventListener.onEditorChange(editor, info);
					},
					500,
					true,
				),
			),
		);

		this.registerEditorExtension([
			inlineSuggestionKeyWatcher,
			inlineSuggestionField,
			inlineSuggestionPlugin,
		]);

		this.copilotAgent = new CopilotAgent(this, vault);
		if (this.settingsTab.isCopilotEnabled())
			await this.copilotAgent.setup();
	}

	onunload() {
		this.copilotAgent.stopAgent();
		this.statusBar = null;
	}
}
