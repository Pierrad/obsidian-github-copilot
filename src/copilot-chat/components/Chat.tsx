import React from "react";
import MainLayout from "../layouts/MainLayout";
import NoHistory from "./sections/NoHistory";
import Header from "./sections/Header";
import Input from "./sections/Input";
import MessageList from "./sections/MessageList";
import { MessageProps } from "./atoms/Message";
import { copilotIcon } from "../../assets/copilot";
import { userIcon } from "../../assets/user";

const Chat: React.FC = () => {
	const [messages, setMessages] = React.useState<MessageProps[]>([
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
		<MainLayout>
			<Header />
			{messages.length === 0 ? (
				<NoHistory />
			) : (
				<MessageList messages={messages} />
			)}
			<Input />
		</MainLayout>
	);
};

export default Chat;
