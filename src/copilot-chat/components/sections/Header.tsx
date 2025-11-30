import React, { useState } from "react";
import { concat, cx } from "../../../utils/style";
import { usePlugin } from "../../hooks/usePlugin";
import { useCopilotStore } from "../../store/store";
import ConversationSelector from "./ConversationSelector";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

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

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div className={concat(BASE_CLASSNAME, "title")}>Chat</div>
			<div className={concat(BASE_CLASSNAME, "actions")}>
				<button
					className={cx(
						concat(BASE_CLASSNAME, "action-button"),
						"clickable-icon",
					)}
					onClick={handleNewConversation}
					aria-label="Start new conversation"
				>
					<ObsidianIcon name="lucide-plus" />
				</button>
				<button
					className={cx(
						concat(BASE_CLASSNAME, "action-button"),
						"clickable-icon",
					)}
					onClick={toggleConversationSelector}
					aria-label="View conversation history"
				>
					<ObsidianIcon name="lucide-history" />
				</button>
				<button
					className={cx(
						concat(BASE_CLASSNAME, "action-button"),
						"clickable-icon",
					)}
					onClick={handleClearChat}
					aria-label="Delete this conversation"
				>
					<ObsidianIcon name="lucide-trash" />
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
