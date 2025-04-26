import { StateCreator } from "zustand";
import { Notice } from "obsidian";
import CopilotPlugin from "../../../main";
import { SendMessageRequest, sendMessage } from "../../api/sendMessage";

export interface MessageData {
	id: string;
	content: string;
	role: "user" | "assistant" | "system";
	timestamp: number;
	linkedNotes?: {
		path: string;
		filename: string;
		content: string;
	}[];
}

export interface ModelOption {
	label: string;
	value: string;
}

export interface MessageSlice {
	messages: MessageData[];
	isLoading: boolean;
	error: string | null;
	selectedModel: ModelOption;
	availableModels: ModelOption[];

	initMessageService: (plugin: CopilotPlugin | undefined) => void;
	sendMessage: (
		plugin: CopilotPlugin | undefined,
		apiMessage: string,
		displayMessage?: string,
		linkedNotes?: { path: string; filename: string; content: string }[],
	) => Promise<void>;
	clearMessages: () => void;
	setSelectedModel: (
		plugin: CopilotPlugin | undefined,
		model: ModelOption,
	) => void;
}

export const defaultModels: ModelOption[] = [
	{ label: "GPT-4o", value: "gpt-4o-2024-08-06" },
	{ label: "GPT-o1", value: "o1-2024-12-17" },
	{ label: "GPT-o3-mini", value: "o3-mini" },
	{ label: "Claude 3.7 Sonnet Thinking", value: "claude-3.7-sonnet-thought" },
	{ label: "Claude 3.7 Sonnet", value: "claude-3.7-sonnet" },
	{ label: "Claude 3.5 Sonnet", value: "claude-3.5-sonnet" },
	{ label: "Gemini 2.0 Flash", value: "gemini-2.0-flash-001" },
	{ label: "Gemini 2.5 Pro", value: "gemini-2.5-pro-preview-03-25" },
];

export const createMessageSlice: StateCreator<
	any, // We use any here as we'll properly type it in the store.ts
	[],
	[],
	MessageSlice
> = (set, get) => ({
	messages: [],
	isLoading: false,
	error: null,
	selectedModel: defaultModels[0],
	availableModels: defaultModels,

	initMessageService: (plugin: CopilotPlugin | undefined) => {
		if (plugin && plugin.settings.chatSettings) {
			const { selectedModel } = plugin.settings.chatSettings;
			if (selectedModel) {
				set({ selectedModel });
			}
		}
	},
	sendMessage: async (
		plugin: CopilotPlugin | undefined,
		apiMessage: string,
		displayMessage?: string,
		linkedNotes?: { path: string; filename: string; content: string }[],
	) => {
		if (!get().isAuthenticated) {
			new Notice("You need to be authenticated to send messages");
			return;
		}

		const notes = linkedNotes || [];

		const userMessage: MessageData = {
			id: Date.now().toString(),
			content: displayMessage || apiMessage,
			role: "user",
			timestamp: Date.now(),
			linkedNotes: notes.length > 0 ? notes : undefined,
		};

		let activeConversationId = get().activeConversationId;

		if (!activeConversationId) {
			activeConversationId = get().createConversation(
				plugin,
				get().selectedModel,
			);
		}

		get().addMessageToConversation(activeConversationId, userMessage);

		set((state: MessageSlice) => ({
			messages: [...state.messages, userMessage],
			isLoading: true,
			error: null,
		}));

		try {
			const validToken = await get().checkAndRefreshToken(plugin);

			if (!validToken) {
				throw new Error("Failed to get a valid access token");
			}

			const activeConversation = get().conversations.find(
				(conv: any) => conv.id === activeConversationId,
			);

			const messageHistory = activeConversation
				? activeConversation.messages.map((msg: MessageData) => ({
						content: msg.content,
						role: msg.role,
					}))
				: get().messages.map((msg: MessageData) => ({
						content: msg.content,
						role: msg.role,
					}));

			const systemPrompt = plugin?.settings.systemPrompt;
			const messages = systemPrompt
				? [{ content: systemPrompt, role: "system" }, ...messageHistory]
				: messageHistory;

			if (notes.length > 0 && messages.length > 0) {
				const lastUserMessageIndex = messages.length - 1;

				const lastUserMessage = messages[lastUserMessageIndex];
				const linkedNotesText = notes
					.map(
						(note) =>
							`\n\nReferenced content from [[${note.filename}]]:\n${note.content}`,
					)
					.join("\n\n");

				messages[lastUserMessageIndex] = {
					...lastUserMessage,
					content: `${lastUserMessage.content}${linkedNotesText}`,
				};
			}

			const requestData: SendMessageRequest = {
				intent: false,
				model: get().selectedModel.value,
				temperature: 0,
				top_p: 1,
				n: 1,
				stream: false,
				messages: messages,
			};

			const response = await sendMessage(requestData, validToken);

			if (response && response.choices && response.choices.length > 0) {
				const assistantMessage: MessageData = {
					id: response.id || Date.now().toString() + "-assistant",
					content: response.choices[0].message.content,
					role: "assistant",
					timestamp: Date.now(),
				};

				get().addMessageToConversation(
					activeConversationId,
					assistantMessage,
				);

				set((state: MessageSlice) => ({
					messages: [...state.messages, assistantMessage],
					isLoading: false,
				}));

				if (plugin) {
					get().saveConversations(plugin);
				}
			}
		} catch (error) {
			console.error("Error sending message:", error);
			set({
				error:
					error instanceof Error
						? error.message
						: "Failed to send message",
				isLoading: false,
			});
			new Notice("Failed to get a response from GitHub Copilot");
		}
	},

	clearMessages: () => {
		set({
			messages: [],
			error: null,
		});

		const plugin = get().plugin;
		if (plugin) {
			get().createConversation(plugin, get().selectedModel);
		}
	},

	setSelectedModel: (
		plugin: CopilotPlugin | undefined,
		model: ModelOption,
	) => {
		set({
			selectedModel: model,
		});

		if (plugin) {
			if (!plugin.settings.chatSettings) {
				plugin.settings.chatSettings = {
					deviceCode: null,
					pat: null,
					accessToken: {
						token: null,
						expiresAt: null,
					},
					selectedModel: model,
				};
			} else {
				plugin.settings.chatSettings.selectedModel = model;
			}

			plugin.saveData(plugin.settings).catch((error) => {
				console.error("Failed to save selected model:", error);
			});
		}
	},
});
