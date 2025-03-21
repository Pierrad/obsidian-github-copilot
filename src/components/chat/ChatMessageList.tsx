import React from "react";
import { concat, cx } from "../../utils/style";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";

const BASE_CLASSNAME = "copilot-chat-message-list";

export interface ChatMessageListProps {
	className?: string;
	messages: ChatMessageProps[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = (props) => {
	const { className, messages } = props;

	return (
		<div
			className={cx(concat(BASE_CLASSNAME, "container"), className || "")}
		>
			{messages.map((message, index) => (
				<div key={index} className={concat(BASE_CLASSNAME, "item")}>
					<ChatMessage {...message} />
				</div>
			))}
		</div>
	);
};

export default ChatMessageList;
