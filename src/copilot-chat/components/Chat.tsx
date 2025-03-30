import React from "react";
import MainLayout from "../layouts/MainLayout";
import NoHistory from "./sections/NoHistory";
import Header from "./sections/Header";
import Input from "./sections/Input";
import MessageList from "./sections/MessageList";
import { MessageProps } from "./atoms/Message";
import { copilotIcon } from "../../assets/copilot";
import { userIcon } from "../../assets/user";
import { useCopilotStore } from "../store/store";

const Chat: React.FC = () => {
	const { messages, isLoading } = useCopilotStore();

	const formattedMessages: MessageProps[] = messages.map((message) => ({
		icon: message.role === "assistant" ? copilotIcon : userIcon,
		name: message.role === "assistant" ? "GitHub Copilot" : "User",
		message: message.content,
	}));

	return (
		<MainLayout>
			<Header />
			{formattedMessages.length === 0 ? (
				<NoHistory />
			) : (
				<MessageList messages={formattedMessages} />
			)}
			<Input isLoading={isLoading} />
		</MainLayout>
	);
};

export default Chat;
