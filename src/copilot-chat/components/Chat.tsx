import React, { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import NoHistory from "./sections/NoHistory";
import Header from "./sections/Header";
import Input from "./sections/Input";
import MessageList from "./sections/MessageList";
import { MessageProps } from "./atoms/Message";
import { copilotIcon } from "../../assets/copilot";
import { userIcon } from "../../assets/user";
import { useCopilotStore } from "../store/store";
import { usePlugin } from "../hooks/usePlugin";

const Chat: React.FC = () => {
	const plugin = usePlugin();
	const {
		messages,
		isLoading,
		conversations,
		activeConversationId,
		initConversationService,
		deleteMessage,
		retryMessage,
	} = useCopilotStore();

	useEffect(() => {
		if (plugin) {
			initConversationService(plugin);
		}
	}, [plugin, initConversationService]);

	const displayMessages = activeConversationId
		? conversations.find((conv) => conv.id === activeConversationId)
			?.messages || []
		: messages;

	const formattedMessages: MessageProps[] = displayMessages.map(
		(message) => ({
			messageId: message.id,
			icon: message.role === "assistant" ? copilotIcon : userIcon,
			name: message.role === "assistant" ? "GitHub Copilot" : "User",
			message: message.content,
			linkedNotes: message.linkedNotes,
		}),
	);

	// Handlers for message actions
	const handleCopy: (id?: string | number, content?: string) => void = (
		id,
		content,
	) => {
		/* No changes needed here */
	};

	const handleDelete: (id?: string | number) => void = (id) => {
		if (typeof id === "string") {
			deleteMessage(plugin, id);
		} else if (typeof id === "number") {
			const conv = activeConversationId
				? conversations.find((c) => c.id === activeConversationId)
				: undefined;
			const list = conv ? conv.messages : messages;
			const msg = list[id ?? -1];
			if (msg) deleteMessage(plugin, msg.id);
		}
	};

	const handleRetry: (id?: string | number) => void = (id) => {
		if (typeof id === "string") {
			retryMessage(plugin, id);
		} else if (typeof id === "number") {
			const conv = activeConversationId
				? conversations.find((c) => c.id === activeConversationId)
				: undefined;
			const list = conv ? conv.messages : messages;
			const msg = list[id ?? -1];
			if (msg) retryMessage(plugin, msg.id);
		}
	};

	return (
		<MainLayout>
			<Header />
			{formattedMessages.length === 0 ? (
				<NoHistory />
			) : (
				<MessageList
					messages={formattedMessages}
					isLoading={isLoading}
					onCopy={handleCopy}
					onDelete={handleDelete}
					onRetry={handleRetry}
				/>
			)}
			<Input isLoading={isLoading} />
		</MainLayout>
	);
};

export default Chat;
