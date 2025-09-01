import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import { concat, cx } from "../../../utils/style";
import { usePlugin } from "../../hooks/usePlugin";
import MermaidDiagram from "./MermaidDiagram";

const BASE_CLASSNAME = "copilot-chat-message";

export interface MessageProps {
	className?: string;
	icon: string;
	name: string;
	message: string;
	linkedNotes?: {
		path: string;
		filename: string;
		content: string;
	}[];
}

interface CodeProps {
	node?: unknown;
	className?: string;
	inline?: boolean;
	children?: React.ReactNode;
}

const ChatMessage: React.FC<MessageProps> = (props) => {
	const { className, icon, name, message, linkedNotes } = props;
	const plugin = usePlugin();
	const [isCopied, setIsCopied] = React.useState(false);

	const isDarkTheme = useMemo(() => {
		return document.body.classList.contains("theme-dark");
	}, [plugin?.app]);

	const isMarkdownEnabled = plugin?.settings?.enableMarkdownRendering ?? true;

	const handleCopyMessage = () => {
		navigator.clipboard
			.writeText(message)
			.then(() => {
				setIsCopied(true);
				setTimeout(() => {
					setIsCopied(false);
				}, 2000);
			})
			.catch((err) => {
				console.error("Failed to copy message: ", err);
			});
	};

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
				<button
					className={concat(BASE_CLASSNAME, "copy-button")}
					onClick={handleCopyMessage}
					title={isCopied ? "Copied!" : "Copy message"}
					aria-label={isCopied ? "Copied!" : "Copy message"}
				>
					{isCopied ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect
								x="9"
								y="9"
								width="13"
								height="13"
								rx="2"
								ry="2"
							></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
					)}
				</button>
			</div>
			<div className={concat(BASE_CLASSNAME, "message")}>
				{isMarkdownEnabled ? (
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							p({ children }) {
								return (
									<p style={{ whiteSpace: "pre-wrap" }}>
										{children}
									</p>
								);
							},
							code({
								className,
								inline,
								children,
								...props
							}: CodeProps) {
								const match = /language-(\w+)/.exec(
									className || "",
								);
								const language = match ? match[1] : "";
								const codeContent = String(
									children || "",
								).replace(/\n$/, "");

								// Handle Mermaid diagrams
								if (
									!inline &&
									(language === "mermaid" ||
										language === "mmd")
								) {
									return (
										<MermaidDiagram
											chart={codeContent}
											isDarkTheme={isDarkTheme}
										/>
									);
								}

								// Handle other code blocks with syntax highlighting
								return !inline && match ? (
									<SyntaxHighlighter
										language={language}
										style={
											isDarkTheme
												? vscDarkPlus
												: (oneLight as Record<
														string,
														React.CSSProperties
													>)
										}
										PreTag="div"
										className={`theme-${
											isDarkTheme ? "dark" : "light"
										}`}
										customStyle={{
											background:
												"var(--code-background)",
											borderRadius: "4px",
										}}
										{...props}
									>
										{codeContent}
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
				) : (
					<div
						className={concat(BASE_CLASSNAME, "plain-text")}
						style={{ whiteSpace: "pre-wrap" }}
					>
						{message}
					</div>
				)}

				{linkedNotes && linkedNotes.length > 0 && (
					<div className={concat(BASE_CLASSNAME, "linked-notes")}>
						<div
							className={concat(
								BASE_CLASSNAME,
								"linked-notes-title",
							)}
						>
							Linked Notes:
						</div>
						<div
							className={concat(
								BASE_CLASSNAME,
								"linked-notes-list",
							)}
						>
							{linkedNotes.map((note, index) => (
								<div
									key={index}
									className={concat(
										BASE_CLASSNAME,
										"linked-note",
									)}
								>
									<span
										className={concat(
											BASE_CLASSNAME,
											"linked-note-filename",
										)}
									>
										[[{note.filename}]]
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatMessage;
