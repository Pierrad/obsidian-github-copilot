import { Notice, Plugin, WorkspaceLeaf } from "obsidian";

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
import ChatView from "./copilot-chat/views/ChatView";

// @ts-expect-error - import to be bundled
import agentInitializer from "official-copilot/agent-initializer.txt";
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

import { CHAT_VIEW_TYPE } from "./copilot-chat/types/constants";

export default class CopilotPlugin extends Plugin {
	settingsTab: CopilotPluginSettingTab;
	settings: CopilotPluginSettings;
	statusBar: StatusBar | null;
	copilotAgent: CopilotAgent;
	private cmExtensionManager: ExtensionManager;
	private eventManager: EventManager;
	version = "1.1.6";
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
				Vault.getAgentInitializerPath(this.app, this.version),
				agentInitializer,
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

		if (
			this.settings.nodePath === DEFAULT_SETTINGS.nodePath ||
			this.settings.nodePath === ""
		) {
			new Notice(
				"[GitHub Copilot] Please set the path to your node executable in the settings to use autocomplete feature.",
			);
		}

		if (
			this.settingsTab.isCopilotEnabled() &&
			!this.settings.nodePathUpdatedToNode20
		) {
			new Notice(
				"[GitHub Copilot] Copilot has changed the minimum node version to 20. Please update your node version if you are using an older version.",
			);
		}

		this.copilotAgent = new CopilotAgent(this);
		if (await this.settingsTab.isCopilotEnabledWithPathCheck()) {
			await this.copilotAgent.setup();
		}

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

		this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
		this.activateView();

		this.addCommand({
			id: "open-copilot-chat",
			name: "Open Copilot Chat",
			callback: () => {
				this.activateView();
				const leaves =
					this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
				if (leaves.length > 0) {
					this.app.workspace.revealLeaf(leaves[0]);
				}
			},
		});
	}

	onunload() {
		this.copilotAgent?.stopAgent();
		this.statusBar = null;
		this.deactivateView();
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
		}
		if (!leaf) {
			Logger.getInstance().error("Failed to create chat view.");
			return;
		}
	}

	async deactivateView() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
	}
}
