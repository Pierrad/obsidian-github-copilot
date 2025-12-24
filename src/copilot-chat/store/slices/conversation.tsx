import { StateCreator } from "zustand";
import { Notice } from "obsidian";
import CopilotPlugin from "../../../main";
import Vault from "../../../helpers/Vault";
import File from "../../../helpers/File";
import Logger from "../../../helpers/Logger";
import { MessageData, ModelOption } from "./message";
import { existsSync } from "fs";

export interface Conversation {
	id: string;
	title: string;
	messages: MessageData[];
	createdAt: number;
	updatedAt: number;
	model: ModelOption;
}

export interface ConversationSlice {
	conversations: Conversation[];
	activeConversationId: string | null;
	isLoadingConversations: boolean;

	initConversationService: (plugin: CopilotPlugin | undefined) => void;
	loadConversations: (plugin: CopilotPlugin) => Promise<void>;
	saveConversations: (plugin: CopilotPlugin) => Promise<void>;

	createConversation: (plugin: CopilotPlugin, model: ModelOption) => string;
	selectConversation: (conversationId: string) => void;
	updateConversation: (
		plugin: CopilotPlugin,
		conversation: Conversation,
	) => void;
	deleteConversation: (plugin: CopilotPlugin, conversationId: string) => void;
	deleteAllConversations: (plugin: CopilotPlugin) => void;

	addMessageToConversation: (
		conversationId: string,
		message: MessageData,
	) => void;

	renameConversation: (
		plugin: CopilotPlugin,
		conversationId: string,
		newTitle: string,
	) => void;
}

// Helper function to get the path to the conversations file
const getConversationsFilePath = (plugin: CopilotPlugin): string => {
	return `${Vault.getPluginPath(plugin.app)}/conversations.json`;
};

const MAX_CONVERSATIONS = 10;

export const createConversationSlice: StateCreator<
	any,
	[],
	[],
	ConversationSlice
> = (set, get) => ({
	conversations: [],
	activeConversationId: null,
	isLoadingConversations: false,

	initConversationService: async (plugin: CopilotPlugin | undefined) => {
		if (!plugin) return;

		set({ isLoadingConversations: true });

		try {
			await get().loadConversations(plugin);
		} catch (error) {
			console.error("Failed to load conversations:", error);
			new Notice("Failed to load conversation history");
		} finally {
			set({ isLoadingConversations: false });
		}
	},

	loadConversations: async (plugin: CopilotPlugin) => {
		try {
			const filePath = getConversationsFilePath(plugin);

			if (!existsSync(filePath)) {
				Logger.getInstance().log(
					"No conversations file found. Starting with empty conversations.",
				);
				return;
			}

			const content = File.readFileSync(filePath);

			if (content) {
				const conversationsData = JSON.parse(content);

				if (Array.isArray(conversationsData.conversations)) {
					set({
						conversations: conversationsData.conversations,
						activeConversationId:
							conversationsData.activeConversationId || null,
					});
				}
			}
		} catch (error) {
			Logger.getInstance().error(
				`No existing conversations found or error loading them: ${error}`,
			);
		}
	},

	saveConversations: async (plugin: CopilotPlugin) => {
		try {
			const { conversations, activeConversationId } = get();
			const filePath = getConversationsFilePath(plugin);

			const pluginDirPath = Vault.getPluginPath(plugin.app);
			if (!existsSync(pluginDirPath)) {
				File.createFolder(pluginDirPath);
			}

			const recentConversations = [...conversations]
				.sort((a, b) => b.updatedAt - a.updatedAt)
				.slice(0, MAX_CONVERSATIONS);

			const conversationsData = {
				conversations: recentConversations,
				activeConversationId,
			};

			File.writeFileSync(
				filePath,
				JSON.stringify(conversationsData, null, 2),
			);
		} catch (error) {
			Logger.getInstance().error(
				`Failed to save conversations: ${error}`,
			);
			new Notice("Failed to save conversation history");
		}
	},

	createConversation: (plugin: CopilotPlugin, model: ModelOption) => {
		const newConversation: Conversation = {
			id: Date.now().toString(),
			title: "New Conversation",
			messages: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
			model: model,
		};

		set((state: ConversationSlice) => ({
			conversations: [newConversation, ...state.conversations],
			activeConversationId: newConversation.id,
		}));

		get().saveConversations(plugin);

		return newConversation.id;
	},

	selectConversation: (conversationId: string) => {
		set({ activeConversationId: conversationId });
	},

	updateConversation: (plugin: CopilotPlugin, conversation: Conversation) => {
		set((state: ConversationSlice) => ({
			conversations: state.conversations.map((conv) =>
				conv.id === conversation.id
					? { ...conversation, updatedAt: Date.now() }
					: conv,
			),
		}));

		get().saveConversations(plugin);
	},

	deleteConversation: (plugin: CopilotPlugin, conversationId: string) => {
		set((state: ConversationSlice) => {
			const newConversations = state.conversations.filter(
				(conv) => conv.id !== conversationId,
			);

			let newActiveId = state.activeConversationId;
			if (conversationId === state.activeConversationId) {
				const mostRecent = newConversations.sort(
					(a, b) => b.updatedAt - a.updatedAt,
				)[0];
				newActiveId = mostRecent ? mostRecent.id : null;
			}

			return {
				conversations: newConversations,
				activeConversationId: newActiveId,
			};
		});

		get().saveConversations(plugin);
	},

	deleteAllConversations: (plugin: CopilotPlugin) => {
		set({
			conversations: [],
			activeConversationId: null,
		});

		get().saveConversations(plugin);

		get().clearMessages();

		new Notice("All conversations deleted");
	},

	addMessageToConversation: (
		conversationId: string,
		message: MessageData,
	) => {
		set((state: ConversationSlice) => {
			const conversation = state.conversations.find(
				(conv) => conv.id === conversationId,
			);

			if (!conversation) return state;

			let title = conversation.title;
			if (conversation.messages.length === 0 && message.role === "user") {
				title =
					message.content.substring(0, 30) +
					(message.content.length > 30 ? "..." : "");
			}

			const updatedConversation = {
				...conversation,
				title: title,
				messages: [...conversation.messages, message],
				updatedAt: Date.now(),
			};

			return {
				conversations: state.conversations.map((conv) =>
					conv.id === conversationId ? updatedConversation : conv,
				),
			};
		});
	},

	renameConversation: (
		plugin: CopilotPlugin,
		conversationId: string,
		newTitle: string,
	) => {
		set((state: ConversationSlice) => ({
			conversations: state.conversations.map((conv) =>
				conv.id === conversationId
					? { ...conv, title: newTitle, updatedAt: Date.now() }
					: conv,
			),
		}));

		get().saveConversations(plugin);
	},
});
