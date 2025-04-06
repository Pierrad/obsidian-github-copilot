import React from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";

const BASE_CLASSNAME = "copilot-chat-conversation-selector";

interface ConversationSelectorProps {
	isOpen: boolean;
	onClose: () => void;
}

const ConversationSelector: React.FC<ConversationSelectorProps> = ({
	isOpen,
	onClose,
}) => {
	const { conversations, activeConversationId, selectConversation } =
		useCopilotStore();

	if (!isOpen) return null;

	const sortedConversations = [...conversations].sort(
		(a, b) => b.updatedAt - a.updatedAt,
	);

	const handleSelectConversation = (conversationId: string) => {
		selectConversation(conversationId);
		onClose();
	};

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleString();
	};

	return (
		<div className={concat(BASE_CLASSNAME, "overlay")} onClick={onClose}>
			<div
				className={concat(BASE_CLASSNAME, "container")}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={concat(BASE_CLASSNAME, "header")}>
					<h3 className={concat(BASE_CLASSNAME, "title")}>
						Conversation History
					</h3>
					<button
						className={concat(BASE_CLASSNAME, "close-button")}
						onClick={onClose}
					>
						×
					</button>
				</div>

				<div className={concat(BASE_CLASSNAME, "list")}>
					{sortedConversations.length === 0 ? (
						<div className={concat(BASE_CLASSNAME, "empty")}>
							No conversations found
						</div>
					) : (
						sortedConversations.map((conversation) => (
							<div
								key={conversation.id}
								className={cx(
									concat(BASE_CLASSNAME, "item"),
									conversation.id === activeConversationId
										? concat(BASE_CLASSNAME, "item-active")
										: "",
								)}
								onClick={() =>
									handleSelectConversation(conversation.id)
								}
							>
								<div
									className={concat(
										BASE_CLASSNAME,
										"item-title",
									)}
								>
									{conversation.title}
								</div>
								<div
									className={concat(
										BASE_CLASSNAME,
										"item-meta",
									)}
								>
									<span
										className={concat(
											BASE_CLASSNAME,
											"item-model",
										)}
									>
										{conversation.model.label}
									</span>
									<span
										className={concat(
											BASE_CLASSNAME,
											"item-date",
										)}
									>
										{formatDate(conversation.updatedAt)}
									</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default ConversationSelector;
