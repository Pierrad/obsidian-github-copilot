import React from "react";
import NoHistory from "./NoHistory";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import { ChatMessageProps } from "./ChatMessage";
import ChatMessageList from "./ChatMessageList";
import { copilotIcon } from "../../assets/copilot";
import { userIcon } from "../../assets/user";

const Chat: React.FC = () => {
	const [messages, setMessages] = React.useState<ChatMessageProps[]>([
		{
			icon: userIcon,
			name: "User",
			message: "What is the weather like today?",
		},
		{
			icon: copilotIcon,
			name: "GitHub Copilot",
			message:
				"The weather is sunny with a high of 75°F. \n" +
				"It's a great day to go outside and enjoy the sun! \n" +
				"Don't forget to wear sunscreen.",
		},
	]);

	return (
		<div className="copilot-chat-container">
			<ChatHeader />
			{messages.length === 0 ? (
				<NoHistory />
			) : (
				<ChatMessageList messages={messages} />
			)}
			<ChatInput />
		</div>
	);
};

export default Chat;
