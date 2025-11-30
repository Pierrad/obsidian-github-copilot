import React, { useEffect, useLayoutEffect, useRef } from "react";
import { CopilotMessage, UserMessage, MessageProps } from "../atoms/Message";
import { concat } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-message-list";

interface MessageListProps {
	messages: MessageProps[];
	isLoading?: boolean;
	onCopy?: (id?: string | number, content?: string) => void;
	onDelete?: (id?: string | number) => void;
	onRetry?: (id?: string | number) => void;
}

const MessageList: React.FC<MessageListProps> = ({
	messages,
	isLoading,
	onCopy,
	onDelete,
	onRetry,
}) => {
	const endOfMessagesRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
		const container = containerRef.current;
		if (container) {
			container.scrollTo({ top: container.scrollHeight, behavior });
		}
		const endMarker = endOfMessagesRef.current;
		if (endMarker) {
			endMarker.scrollIntoView({ behavior });
		}
	};

	useLayoutEffect(() => {
		// 在消息变更后，等待布局完成再滚动，保证切换历史记录时可靠
		const timer = setTimeout(() => {
			scrollToBottom("smooth");
		}, 0);
		return () => clearTimeout(timer);
	}, [messages]);

	// 初次挂载后，延迟滚动一次，避免 Obsidian 启动阶段渲染时机导致未滚动
	useLayoutEffect(() => {
		const timer = setTimeout(() => {
			scrollToBottom("auto");
		}, 30);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (isLoading) {
			scrollToBottom("smooth");
		}
	}, [isLoading]);

	// 当历史记录加载完成（isLoading -> false）时，滚动到底部
	useEffect(() => {
		if (!isLoading) {
			scrollToBottom("smooth");
		}
	}, [isLoading, messages]);

	return (
		<div className={concat(BASE_CLASSNAME, "container")} ref={containerRef}>
			{messages.map((message, index) => {
				const isCopilot = message.name === "GitHub Copilot";
				const Comp = isCopilot ? CopilotMessage : UserMessage;
				return (
					<Comp
						key={message.messageId ?? index}
						className={concat(BASE_CLASSNAME, "item")}
						icon={message.icon}
						name={message.name}
						message={message.message}
						linkedNotes={message.linkedNotes}
						messageId={message.messageId ?? index}
						onCopy={onCopy}
						onDelete={onDelete}
						onRetry={onRetry}
					/>
				);
			})}
			<div ref={endOfMessagesRef} />
		</div>
	);
};

export default MessageList;
