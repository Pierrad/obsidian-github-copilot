import React from "react";
import { concat, cx } from "../../../utils/style";
import Message, { MessageProps } from "../atoms/Message";

const BASE_CLASSNAME = "copilot-chat-message-list";

export interface MessageListProps {
	className?: string;
	messages: MessageProps[];
}

const MessageList: React.FC<MessageListProps> = (props) => {
	const { className, messages } = props;

	return (
		<div
			className={cx(concat(BASE_CLASSNAME, "container"), className || "")}
		>
			{messages.map((message, index) => (
				<div key={index} className={concat(BASE_CLASSNAME, "item")}>
					<Message {...message} />
				</div>
			))}
		</div>
	);
};

export default MessageList;
