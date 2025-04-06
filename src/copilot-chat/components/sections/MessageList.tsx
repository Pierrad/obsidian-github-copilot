import React, { useEffect, useRef } from "react";
import ChatMessage, { MessageProps } from "../atoms/Message";
import { concat, cx } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-message-list";

interface MessageListProps {
	messages: MessageProps[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
	const endOfMessagesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (endOfMessagesRef.current) {
			endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			{messages.map((message, index) => (
				<ChatMessage
					key={index}
					className={cx(
						concat(BASE_CLASSNAME, "item"),
						message.name === "GitHub Copilot"
							? concat(BASE_CLASSNAME, "assistant")
							: concat(BASE_CLASSNAME, "user"),
					)}
					icon={message.icon}
					name={message.name}
					message={message.message}
				/>
			))}
			<div ref={endOfMessagesRef} />
		</div>
	);
};

export default MessageList;
