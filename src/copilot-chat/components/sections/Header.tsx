import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { concat } from "../../../utils/style";
import { usePlugin } from "../../hooks/usePlugin";
import { useCopilotStore } from "../../store/store";
import ConversationSelector from "./ConversationSelector";
import { DEFAULT_SETTINGS } from "../../../settings/CopilotPluginSettingTab";

const BASE_CLASSNAME = "copilot-chat-header";

const Header: React.FC = () => {
	const plugin = usePlugin();
	const {
		clearMessages,
		activeConversationId,
		deleteConversation,
		createConversation,
		selectedModel,
	} = useCopilotStore();
	const [isConversationSelectorOpen, setIsConversationSelectorOpen] =
		useState(false);

	const handleClearChat = () => {
		if (confirm("Are you sure you want to delete this conversation?")) {
			if (activeConversationId && plugin) {
				deleteConversation(plugin, activeConversationId);
				clearMessages();
				createConversation(plugin, selectedModel);
			} else {
				clearMessages();
			}
		}
	};

	const handleNewConversation = () => {
		if (plugin) {
			createConversation(plugin, selectedModel);
			clearMessages();
		}
	};

	const toggleConversationSelector = () => {
		setIsConversationSelectorOpen(!isConversationSelectorOpen);
	};

	const chatHotkeys =
		plugin?.settings?.chatHotkeys ?? DEFAULT_SETTINGS.chatHotkeys;

	// Keyboard shortcuts
	useHotkeys(chatHotkeys.newConversation, handleNewConversation, {
		description: "Start new conversation",
	});

	useHotkeys(chatHotkeys.conversationHistory, toggleConversationSelector, {
		description: "View conversation history",
	});

	useHotkeys(chatHotkeys.deleteConversation, handleClearChat, {
		description: "Delete this conversation",
	});

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div className={concat(BASE_CLASSNAME, "title")}>Chat</div>
			<div className={concat(BASE_CLASSNAME, "actions")}>
				<button
					type="button"
					className={concat(BASE_CLASSNAME, "action-button")}
					onClick={handleNewConversation}
					aria-label={`Start new conversation (${chatHotkeys.newConversation})`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M12 5v14"></path>
						<path d="M5 12h14"></path>
					</svg>
				</button>
				<button
					type="button"
					className={concat(BASE_CLASSNAME, "action-button")}
					onClick={toggleConversationSelector}
					aria-label={`View conversation history (${chatHotkeys.conversationHistory})`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</button>
				<button
					type="button"
					className={concat(BASE_CLASSNAME, "action-button")}
					onClick={handleClearChat}
					aria-label={`Delete this conversation (${chatHotkeys.deleteConversation})`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M3 6h18"></path>
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
					</svg>
				</button>
			</div>
			<ConversationSelector
				isOpen={isConversationSelectorOpen}
				onClose={() => setIsConversationSelectorOpen(false)}
			/>
		</div>
	);
};

export default Header;
