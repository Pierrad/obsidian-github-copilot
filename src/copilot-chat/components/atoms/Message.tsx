import React from "react";
import { concat, cx } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-message";

export interface MessageProps {
	className?: string;
	icon: string;
	name: string;
	message: string;
}

const ChatMessage: React.FC<MessageProps> = (props) => {
	const { className, icon, name, message } = props;

	return (
		<div
			className={cx(concat(BASE_CLASSNAME, "container"), className || "")}
		>
			<div className={concat(BASE_CLASSNAME, "info")}>
				<div
					className={concat(BASE_CLASSNAME, "icon")}
					dangerouslySetInnerHTML={{ __html: icon }}
				/>
				<div className={concat(BASE_CLASSNAME, "name")}>{name}</div>
			</div>
			<div className={concat(BASE_CLASSNAME, "message")}>{message}</div>
		</div>
	);
};

export default ChatMessage;
