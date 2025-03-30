import { StateCreator } from "zustand";
import { Notice } from "obsidian";
import CopilotPlugin from "../../../main";
import { SendMessageRequest, sendMessage } from "../../api/sendMessage";

export interface MessageData {
	id: string;
	content: string;
	role: "user" | "assistant";
	timestamp: number;
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

	sendMessage: (
		plugin: CopilotPlugin | undefined,
		content: string,
	) => Promise<void>;
	clearMessages: () => void;
	setSelectedModel: (model: ModelOption) => void;
}

const defaultModels: ModelOption[] = [
	{ label: "GPT-4o", value: "gpt-4o-2024-08-06" },
	{ label: "GPT-o1", value: "o1-2024-12-17" },
	{ label: "GPT-o3-mini", value: "o3-mini" },
	{ label: "Claude 3.7 Sonnet Thinking", value: "claude-3.7-sonnet-thought" },
	{ label: "Claude 3.7 Sonnet", value: "claude-3.7-sonnet" },
	{ label: "Claude 3.5 Sonnet", value: "claude-3.5-sonnet" },
	{ label: "Gemini 2.0 Flash", value: "gemini-2.0-flash-001" },
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

	sendMessage: async (plugin: CopilotPlugin | undefined, content: string) => {
		if (!get().isAuthenticated) {
			new Notice("You need to be authenticated to send messages");
			return;
		}

		const userMessage: MessageData = {
			id: Date.now().toString(),
			content,
			role: "user",
			timestamp: Date.now(),
		};

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

			const messageHistory = get().messages.map((msg: MessageData) => ({
				content: msg.content,
				role: msg.role,
			}));

			const requestData: SendMessageRequest = {
				intent: false,
				model: get().selectedModel.value,
				temperature: 0,
				top_p: 1,
				n: 1,
				stream: false,
				messages: messageHistory,
			};

			const response = await sendMessage(requestData, validToken);

			if (response && response.choices && response.choices.length > 0) {
				const assistantMessage: MessageData = {
					id: response.id || Date.now().toString() + "-assistant",
					content: response.choices[0].message.content,
					role: "assistant",
					timestamp: Date.now(),
				};

				set((state: MessageSlice) => ({
					messages: [...state.messages, assistantMessage],
					isLoading: false,
				}));
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
	},

	setSelectedModel: (model: ModelOption) => {
		set({
			selectedModel: model,
		});
	},
});
