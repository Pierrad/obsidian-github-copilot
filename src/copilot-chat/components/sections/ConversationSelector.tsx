import React from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";

const BASE_CLASSNAME = "copilot-chat-conversation-selector";

interface ConversationSelectorProps {
	isOpen: boolean;
	onClose: () => void;
}

const ConversationSelector: React.FC<ConversationSelectorProps> = ({
	isOpen,
	onClose,
}) => {
	const plugin = usePlugin();
	const {
		conversations,
		activeConversationId,
		selectConversation,
		deleteConversation,
		deleteAllConversations,
	} = useCopilotStore();

	if (!isOpen) return null;

	const sortedConversations = [...conversations].sort(
		(a, b) => b.updatedAt - a.updatedAt,
	);

	const handleSelectConversation = (conversationId: string) => {
		selectConversation(conversationId);
		onClose();
	};

	const handleDeleteConversation = (
		e: React.MouseEvent,
		conversationId: string,
	) => {
		e.stopPropagation();
		if (!plugin) return;

		if (confirm("Are you sure you want to delete this conversation?")) {
			deleteConversation(plugin, conversationId);
		}
	};

	const handleDeleteAllConversations = () => {
		if (!plugin) return;

		if (
			confirm(
				"Are you sure you want to delete all conversations? This action cannot be undone.",
			)
		) {
			deleteAllConversations(plugin);
			onClose();
		}
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
					<div className={concat(BASE_CLASSNAME, "header-actions")}>
						{conversations.length > 0 && (
							<button
								className={concat(
									BASE_CLASSNAME,
									"delete-all-button",
								)}
								onClick={handleDeleteAllConversations}
								title="Delete all conversations"
							>
								Delete All
							</button>
						)}
						<button
							className={concat(BASE_CLASSNAME, "close-button")}
							onClick={onClose}
						>
							×
						</button>
					</div>
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
										"item-content",
									)}
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
								<button
									className={concat(
										BASE_CLASSNAME,
										"delete-button",
									)}
									onClick={(e) =>
										handleDeleteConversation(
											e,
											conversation.id,
										)
									}
									title="Delete conversation"
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
									>
										<polyline points="3 6 5 6 21 6"></polyline>
										<path d="m19 6-1 14H6L5 6"></path>
										<path d="m10 11 0 6"></path>
										<path d="m14 11 0 6"></path>
									</svg>
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default ConversationSelector;
