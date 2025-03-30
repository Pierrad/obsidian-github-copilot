import React, { useMemo } from "react";
import { concat, cx } from "../../../utils/style";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { usePlugin } from "../../hooks/usePlugin";

const BASE_CLASSNAME = "copilot-chat-message";

export interface MessageProps {
	className?: string;
	icon: string;
	name: string;
	message: string;
}

interface CodeProps {
	node?: unknown;
	className?: string;
	inline?: boolean;
	children?: React.ReactNode;
}

const ChatMessage: React.FC<MessageProps> = (props) => {
	const { className, icon, name, message } = props;
	const plugin = usePlugin();

	const isDarkTheme = useMemo(() => {
		return document.body.classList.contains("theme-dark");
	}, [plugin?.app]);

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
			<div className={concat(BASE_CLASSNAME, "message")}>
				<ReactMarkdown
					components={{
						code({
							className,
							inline,
							children,
							...props
						}: CodeProps) {
							const match = /language-(\w+)/.exec(
								className || "",
							);
							return !inline && match ? (
								<SyntaxHighlighter
									language={match[1]}
									style={
										isDarkTheme
											? vscDarkPlus
											: (oneLight as Record<
													string,
													React.CSSProperties
												>)
									}
									PreTag="div"
									className={`theme-${isDarkTheme ? "dark" : "light"}`}
									customStyle={{
										background: "var(--code-background)",
										borderRadius: "4px",
									}}
									{...props}
								>
									{String(children || "").replace(/\n$/, "")}
								</SyntaxHighlighter>
							) : (
								<code className={className} {...props}>
									{children}
								</code>
							);
						},
					}}
				>
					{message}
				</ReactMarkdown>
			</div>
		</div>
	);
};

export default ChatMessage;
