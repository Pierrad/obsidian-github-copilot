import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { CHAT_VIEW_TYPE } from "../types/constants";
import CopilotPlugin from "../../main";
import Chat from "../components/Chat";

export const PluginContext = React.createContext<CopilotPlugin | undefined>(
	undefined,
);

export default class ChatView extends ItemView {
	private root: Root | null = null;
	private plugin: CopilotPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: CopilotPlugin) {
		super(leaf);
		this.app = plugin.app;
		this.plugin = plugin;
	}

	getViewType(): string {
		return CHAT_VIEW_TYPE;
	}

	getIcon(): string {
		return "bot-message-square";
	}

	getTitle(): string {
		return "Copilot Chat";
	}

	getDisplayText(): string {
		return "Copilot Chat";
	}

	async onOpen(): Promise<void> {
		const root = createRoot(this.containerEl.children[1]);

		root.render(
			<PluginContext.Provider value={this.plugin}>
				<React.StrictMode>
					<Chat />
				</React.StrictMode>
			</PluginContext.Provider>,
		);
	}

	async onClose(): Promise<void> {
		if (this.root) {
			this.root.unmount();
		}
	}

	updateView(): void {
		this.onOpen();
	}
}
