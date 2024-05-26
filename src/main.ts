import { Notice, Plugin } from "obsidian";

import EventManager from "./events/EventManager";
import CopilotAgent from "./copilot/CopilotAgent";
import StatusBar from "./status/StatusBar";
import CopilotPluginSettingTab, {
	CopilotPluginSettings,
	DEFAULT_SETTINGS,
} from "./settings/CopilotPluginSettingTab";
import ExtensionManager from "./extensions/ExtensionManager";
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
	private cmExtensionManager: ExtensionManager;
	private eventManager: EventManager;
	version = "1.0.2";

	async onload() {
		this.settingsTab = new CopilotPluginSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.settingsTab.loadSettings();

		this.statusBar = new StatusBar(this);

		Logger.getInstance().setDebug(this.settings.debug);

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

		if (this.settings.nodePath === DEFAULT_SETTINGS.nodePath) {
			new Notice(
				"Please set the path to your node executable in the settings.",
			);
		}

		this.eventManager = new EventManager(this);
		this.eventManager.registerEvents();

		this.cmExtensionManager = new ExtensionManager(this);
		this.registerEditorExtension(this.cmExtensionManager.getExtensions());

		this.copilotAgent = new CopilotAgent(this);
		if (
			this.settingsTab.isCopilotEnabled() &&
			this.settings.nodePath !== DEFAULT_SETTINGS.nodePath
		)
			await this.copilotAgent.setup();
	}

	onunload() {
		this.copilotAgent?.stopAgent();
		this.statusBar = null;
	}
}
