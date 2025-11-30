import React, { useMemo } from "react";
import { concat, cx } from "../../../utils/style";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { usePlugin } from "../../hooks/usePlugin";
import { LinkedNotes } from "./LinkedNotes";
import { ObsidianIcon } from "./ObsidianIcon";

const BASE_CLASSNAME = "copilot-chat-message";

export interface MessageProps {
	className?: string;
	icon: string;
	name: string;
	message: string;
	messageId?: string | number;
	onCopy?: (messageId?: string | number, content?: string) => void;
	onDelete?: (messageId?: string | number) => void;
	onRetry?: (messageId?: string | number) => void;
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

// Build component mappings for ReactMarkdown
const getMarkdownComponents = (isDarkTheme: boolean) => {
	const themeClass = `theme-${isDarkTheme ? "dark" : "light"}`;
	const codeStyle = isDarkTheme
		? vscDarkPlus
		: (oneLight as Record<string, React.CSSProperties>);

	const CodeBlock = ({
		className,
		inline,
		children,
		...props
	}: CodeProps) => {
		const match = className?.match(/language-(\w+)/);

		if (!inline && match) {
			return (
				<SyntaxHighlighter
					language={match[1]}
					style={codeStyle}
					PreTag="div"
					className={themeClass}
					customStyle={{
						background: "var(--code-background)",
						borderRadius: "4px",
					}}
					{...props}
				>
					{String(children || "").replace(/\n$/, "")}
				</SyntaxHighlighter>
			);
		}

		return (
			<code className={className} {...props}>
				{children}
			</code>
		);
	};

	return {
		p: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
		code: CodeBlock,
	};
};

// Shared inner render: text, code highlighting, and linked notes
const ChatMessageContent: React.FC<{
	message: string;
	isDarkTheme: boolean;
	showRaw: boolean;
	onClick?: React.MouseEventHandler<HTMLDivElement>;
	style?: React.CSSProperties;
}> = ({ message, isDarkTheme, onClick, style, showRaw }) => {
	return (
		<div
			className={concat(BASE_CLASSNAME, "message")}
			onClick={onClick}
			style={style}
		>
			{showRaw ? (
				<p>{message}</p>
			) : (
				<ReactMarkdown components={getMarkdownComponents(isDarkTheme)}>
					{message}
				</ReactMarkdown>
			)}
		</div>
	);
};

// Visual wrapper: Copilot messages
export const CopilotMessage: React.FC<MessageProps> = (props) => {
	const {
		className,
		message,
		linkedNotes,
		messageId,
		onCopy,
		onDelete,
		onRetry,
	} = props;
	const plugin = usePlugin();
	const [isCopied, setIsCopied] = React.useState(false);
	const [showRaw, setShowRaw] = React.useState(false);

	const isDarkTheme = useMemo(() => {
		return document.body.classList.contains("theme-dark");
	}, [plugin?.app]);

	const handleCopyMessage = () => {
		navigator.clipboard
			.writeText(message)
			.then(() => {
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 2000);
			})
			.catch((err) => console.error("Failed to copy message: ", err));
		onCopy?.(messageId, message);
	};

	const handleDelete = () => {
		onDelete?.(messageId);
	};

	const handleRetry = () => {
		onRetry?.(messageId);
	};

	return (
		<div
			className={cx(
				concat(BASE_CLASSNAME, "container"),
				concat(BASE_CLASSNAME, "assistant"),
				className || "",
			)}
		>
			<ChatMessageContent
				message={message}
				isDarkTheme={isDarkTheme}
				showRaw={showRaw}
			/>
			{linkedNotes && linkedNotes.length > 0 && (
				<LinkedNotes notes={linkedNotes} />
			)}
			<div className={concat(BASE_CLASSNAME, "actions")}>
				{/* actions moved to bottom */}
				<button
					className={concat(BASE_CLASSNAME, "copy-button")}
					onClick={handleCopyMessage}
					aria-label={isCopied ? "Copied!" : "Copy message"}
				>
					<ObsidianIcon
						name={isCopied ? "lucide-check" : "lucide-copy"}
					/>
				</button>
				<button
					className={concat(BASE_CLASSNAME, "switch-button")}
					onClick={() => setShowRaw((v) => !v)}
					aria-label={
						showRaw ? "Switch to rendered" : "Switch to source"
					}
				>
					<ObsidianIcon
						name={showRaw ? "lucide-book-open" : "lucide-code-xml"}
					/>
				</button>
				<button
					className={concat(BASE_CLASSNAME, "delete-button")}
					onClick={handleDelete}
					aria-label="Delete message"
				>
					<ObsidianIcon name="lucide-trash-2" />
				</button>
				<button
					className={concat(BASE_CLASSNAME, "retry-button")}
					onClick={handleRetry}
					aria-label="Retry"
				>
					<ObsidianIcon name="lucide-rotate-cw" />
				</button>
			</div>
		</div>
	);
};

// Visual wrapper: User messages
export const UserMessage: React.FC<MessageProps> = (props) => {
	const { className, message, linkedNotes, messageId, onCopy, onDelete } =
		props;
	const plugin = usePlugin();
	const [isCopied, setIsCopied] = React.useState(false);
	const [showRaw, setShowRaw] = React.useState(false);
	const [isCollapsed, setIsCollapsed] = React.useState<boolean>(true);
	const [contentHeight, setContentHeight] = React.useState<number>(0);

	const collapsibleRef = React.useRef<HTMLDivElement>(null);
	const [animatedHeight, setAnimatedHeight] = React.useState<number>(0);

	React.useLayoutEffect(() => {
		const wrapper = collapsibleRef.current;
		if (!wrapper) return;
		const content = wrapper.querySelector(
			`.${BASE_CLASSNAME}-message`,
		) as HTMLElement | null;
		if (!content) return;

		// Expanded height equals real content height; collapsed is min(full, 100px)
		let full = content.scrollHeight;
		if (showRaw) {
			// In source mode, use the sum of all child element heights (including margins)
			const children = Array.from(content.children) as HTMLElement[];
			full = children.reduce((sum, el) => {
				const rectH = el.offsetHeight;
				const cs = window.getComputedStyle(el);
				const mt = parseFloat(cs.marginTop || "0");
				const mb = parseFloat(cs.marginBottom || "0");
				return sum + rectH + mt + mb;
			}, 0);
		}
		setContentHeight(full);
		const collapsed = Math.min(full, 100);
		const target = isCollapsed ? collapsed : full;
		setAnimatedHeight(target);

		// If content height is not greater than 100px, do not collapse
		if (full <= 100 && isCollapsed) {
			setIsCollapsed(false);
		}
	}, [isCollapsed, message, showRaw]);

	// When collapsed, if horizontal scroll exists, scroll back to the left
	React.useEffect(() => {
		const wrapper = collapsibleRef.current;
		if (!wrapper) return;
		const content = wrapper.querySelector(
			`.${BASE_CLASSNAME}-message`,
		) as HTMLElement | null;
		if (!content) return;
		if (isCollapsed && content.scrollLeft > 0) {
			content.scrollTo({ left: 0, behavior: "smooth" });
		}
	}, [isCollapsed]);

	const isDarkTheme = useMemo(() => {
		return document.body.classList.contains("theme-dark");
	}, [plugin?.app]);

	const handleCopyMessage = () => {
		onCopy?.(messageId, message);
	};

	const handleDelete = () => {
		onDelete?.(messageId);
	};

	return (
		<div
			ref={collapsibleRef}
			className={cx(
				concat(BASE_CLASSNAME, "container"),
				concat(BASE_CLASSNAME, "user"),
				contentHeight > 100
					? concat(BASE_CLASSNAME, "collapsible")
					: "",
				isCollapsed ? concat(BASE_CLASSNAME, "collapsed") : "",
				className || "",
			)}
		>
			<ChatMessageContent
				message={message}
				isDarkTheme={isDarkTheme}
				showRaw={showRaw}
				onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
				style={
					contentHeight > 100 ? { height: animatedHeight } : undefined
				}
			/>
			{contentHeight > 100 && (
				<button
					className={cx(
						concat(BASE_CLASSNAME, "toggle-button"),
						concat(BASE_CLASSNAME, "expand-collapse-button"),
						isCollapsed ? concat(BASE_CLASSNAME, "collapsed") : "",
					)}
					onClick={() => setIsCollapsed((c) => !c)}
					aria-label={
						isCollapsed ? "Expand message" : "Collapse message"
					}
				>
					<ObsidianIcon name="lucide-chevron-down" />
				</button>
			)}

			{linkedNotes && linkedNotes.length > 0 && (
				<LinkedNotes notes={linkedNotes} />
			)}

			<div className={concat(BASE_CLASSNAME, "actions")}>
				{/* actions moved below for user */}
				<button
					className={concat(BASE_CLASSNAME, "copy-button")}
					onClick={handleCopyMessage}
					aria-label={isCopied ? "Copied!" : "Copy message"}
				>
					<ObsidianIcon
						name={isCopied ? "lucide-check" : "lucide-copy"}
					/>
				</button>
				<button
					className={concat(BASE_CLASSNAME, "switch-button")}
					onClick={() => setShowRaw((v) => !v)}
					aria-label={
						showRaw ? "Switch to rendered" : "Switch to source"
					}
				>
					<ObsidianIcon
						name={showRaw ? "lucide-book-open" : "lucide-code-xml"}
					/>
				</button>
				<button
					className={concat(BASE_CLASSNAME, "delete-button")}
					onClick={handleDelete}
					aria-label="Delete message"
				>
					<ObsidianIcon name="lucide-trash-2" />
				</button>
			</div>
		</div>
	);
};
