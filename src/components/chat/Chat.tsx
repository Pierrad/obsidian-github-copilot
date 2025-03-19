import React from "react";
import NoHistory from "./NoHistory";
import ChatInput from "./ChatInput";

const Chat: React.FC = () => {
	const [messages, setMessages] = React.useState<string[]>([]);

	return (
		<div className="copilot-chat-container">
			{messages.length === 0 ? <NoHistory /> : null}
			<ChatInput />
		</div>
	);
};

export default Chat;
