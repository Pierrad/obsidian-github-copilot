import {
	Debouncer,
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	TFile,
	debounce,
} from "obsidian";

import CopilotPlugin from "../main";
import EventListener from "./EventListener";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";
import Vault from "../helpers/Vault";

class EventManager implements SettingsObserver {
	private plugin: CopilotPlugin;
	private eventListener: EventListener;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private debouncedEditorChangeHandler: Debouncer<any, any>;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.eventListener = new EventListener(this.plugin);
		this.plugin.settingsTab.registerObserver(this);
	}

	public registerEvents(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-open", async (file: TFile) => {
				if (await this.canRegisterEvent(file)) {
					this.eventListener.onFileOpen(file);
				}
			}),
		);

		if (this.plugin.settings.onlyOnHotkey) return; // do not register editor change event if onlyOnHotkey is enabled

		this.debouncedEditorChangeHandler = debounce(
			async (editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
				if (await this.canRegisterEvent(info?.file as TFile)) {
					this.eventListener.onEditorChange(editor, info);
				}
			},
			this.plugin.settings.suggestionDelay,
			true,
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on(
				"editor-change",
				this.debouncedEditorChangeHandler,
			),
		);
	}

	public unRegisterEvents(): void {
		this.plugin.app.workspace.off("file-open", this.fileOpenHandler);
		this.plugin.app.workspace.off(
			"editor-change",
			this.debouncedEditorChangeHandler,
		);
	}

	private fileOpenHandler = async (file: TFile | null): Promise<void> => {
		await this.eventListener.onFileOpen(file);
	};

	// Only register event if copilot is enabled and file is not excluded
	private async canRegisterEvent(file: TFile): Promise<boolean> {
		return (
			(await this.plugin.settingsTab.isCopilotEnabledWithPathCheck()) &&
			!Vault.isFileExcluded(
				file?.path as string,
				this.plugin.settings.exclude,
			)
		);
	}

	onSettingsUpdate(): Promise<void> {
		this.unRegisterEvents();
		this.registerEvents();
		return Promise.resolve();
	}
}
export default EventManager;
