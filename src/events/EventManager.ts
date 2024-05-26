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
			this.plugin.app.workspace.on("file-open", this.fileOpenHandler),
		);

		this.debouncedEditorChangeHandler = debounce(
			async (editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
				if (this.plugin.settingsTab.isCopilotEnabled())
					this.eventListener.onEditorChange(editor, info);
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

	onSettingsUpdate(): Promise<void> {
		this.unRegisterEvents();
		this.registerEvents();
    return Promise.resolve();
	}
}
export default EventManager;
