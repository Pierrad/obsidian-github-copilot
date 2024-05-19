import { Plugin } from "obsidian";
import { debounce } from "obsidian";

import EventListener from "./EventListener";
import CopilotAgent from "./copilot/CopilotAgent";
import StatusBar from "./status/StatusBar";
import CopilotPluginSettingTab, {
	CopilotPluginSettings,
} from "./settings/CopilotPluginSettingTab";
import { inlineSuggestionPlugin } from "./extensions/InlineSuggestionPlugin";
import { inlineSuggestionField } from "./extensions/InlineSuggestionState";
import { inlineSuggestionKeyWatcher } from "./extensions/InlineSuggestionKeyWatcher";
import Vault from "./helpers/Vault";
import File from "./helpers/File";
import Logger from "./helpers/Logger";

// @ts-expect-error - import to be bundled
import agent from "official-copilot/agent.txt";
// @ts-expect-error - import to be bundled
import tokenizer from "official-copilot/resources/cl100k/tokenizer_cushman002.json";
// @ts-expect-error - import to be bundled
import vocab from "official-copilot/resources/cl100k/vocab_cushman002.bpe";

export default class CopilotPlugin extends Plugin {
	settingsTab: CopilotPluginSettingTab;
	settings: CopilotPluginSettings;
	statusBar: StatusBar | null;
	copilotAgent: CopilotAgent;
	version = "1.0.0";

	async onload() {
		this.settingsTab = new CopilotPluginSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.settingsTab.loadSettings();

		this.statusBar = new StatusBar(this);

		Logger.getInstance().setDebug(false);
		const eventListener = new EventListener(this);

		// Recreate or update the copilot folder and artifacts from the bundle
		if (
			!File.doesFolderExist(Vault.getCopilotPath(this.app, this.version))
		) {
			await File.createFolder(
				Vault.getCopilotResourcesPath(this.app, this.version),
			);
			await File.createFile(
				Vault.getAgentPath(this.app, this.version),
				agent,
			);
			await File.createFile(
				Vault.getTokenizerPath(this.app, this.version),
				JSON.stringify(tokenizer),
			);
			await File.createFile(
				Vault.getVocabPath(this.app, this.version),
				vocab,
			);
			await File.removeOldCopilotFolders(
				this.version,
				Vault.getPluginPath(this.app),
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

		this.copilotAgent = new CopilotAgent(this);
		if (this.settingsTab.isCopilotEnabled())
			await this.copilotAgent.setup();
	}

	onunload() {
		this.copilotAgent?.stopAgent();
		this.statusBar = null;
	}
}
