import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { App } from "obsidian";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { CHAT_VIEW_TYPE } from "../types/constants";
import CopilotPlugin from "../main";

export const AppContext = React.createContext<App | undefined>(undefined);

export default class ChatView extends ItemView {
	private root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: CopilotPlugin,
	) {
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
			<AppContext.Provider value={this.app}>
				<React.StrictMode>
					<div>Chat Interface</div>
				</React.StrictMode>
			</AppContext.Provider>,
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
