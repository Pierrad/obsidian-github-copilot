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

export interface MessageSlice {
	messages: MessageData[];
	isLoading: boolean;
	error: string | null;

	sendMessage: (
		plugin: CopilotPlugin | undefined,
		content: string,
	) => Promise<void>;
	clearMessages: () => void;
}

export const createMessageSlice: StateCreator<
	any, // We use any here as we'll properly type it in the store.ts
	[],
	[],
	MessageSlice
> = (set, get) => ({
	messages: [],
	isLoading: false,
	error: null,

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
				model: "gpt-4o-2024-08-06",
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
});
