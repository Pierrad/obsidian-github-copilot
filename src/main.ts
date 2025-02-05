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
import Cacher from "./copilot/Cacher";

// @ts-expect-error - import to be bundled
import agent from "official-copilot/agent.txt";
// @ts-expect-error - import to be bundled
import cl100k from "official-copilot/resources/cl100k_base.tiktoken";
// @ts-expect-error - import to be bundled
import o200k from "official-copilot/resources/o200k_base.tiktoken";
// @ts-expect-error - import to be bundled
import cl100kNoIndex from "official-copilot/resources/cl100k_base.tiktoken.noindex";
// @ts-expect-error - import to be bundled
import o200kNoIndex from "official-copilot/resources/o200k_base.tiktoken.noindex";

export default class CopilotPlugin extends Plugin {
	settingsTab: CopilotPluginSettingTab;
	settings: CopilotPluginSettings;
	statusBar: StatusBar | null;
	copilotAgent: CopilotAgent;
	private cmExtensionManager: ExtensionManager;
	private eventManager: EventManager;
	version = "1.0.11";
	tabSize = Vault.DEFAULT_TAB_SIZE;

	async onload() {
		this.settingsTab = new CopilotPluginSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		await this.settingsTab.loadSettings();

		this.statusBar = new StatusBar(this);

		Logger.getInstance().setDebug(this.settings.debug);

		this.tabSize = Vault.getTabSize(this.app);

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
				`${Vault.getCopilotResourcesPath(this.app, this.version)}/cl100k_base.tiktoken`,
				cl100k,
			);
			await File.createFile(
				`${Vault.getCopilotResourcesPath(this.app, this.version)}/o200k_base.tiktoken`,
				o200k,
			);
			await File.createFile(
				`${Vault.getCopilotResourcesPath(this.app, this.version)}/cl100k_base.tiktoken.noindex`,
				cl100kNoIndex,
			);
			await File.createFile(
				`${Vault.getCopilotResourcesPath(this.app, this.version)}/o200k_base.tiktoken.noindex`,
				o200kNoIndex,
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

		this.copilotAgent = new CopilotAgent(this);
		if (
			this.settingsTab.isCopilotEnabled() &&
			this.settings.nodePath !== DEFAULT_SETTINGS.nodePath
		)
			await this.copilotAgent.setup();

		this.eventManager = new EventManager(this);
		this.eventManager.registerEvents();

		this.cmExtensionManager = new ExtensionManager(this);
		this.registerEditorExtension(this.cmExtensionManager.getExtensions());

		const file = this.app.workspace.getActiveFile();
		if (file) {
			Cacher.getInstance().setCurrentFilePath(
				Vault.getBasePath(this.app),
				file.path,
			);
		}
	}

	onunload() {
		this.copilotAgent?.stopAgent();
		this.statusBar = null;
	}
}
