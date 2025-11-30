import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";
import ModelSelector from "./ModelSelector";
import FileSuggestion from "../atoms/FileSuggestion";
import { Notice, TFile } from "obsidian";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

const BASE_CLASSNAME = "copilot-chat-input";

interface InputProps {
	isLoading?: boolean;
}

interface CursorPosition {
	start: number;
	end: number;
}

const Input: React.FC<InputProps> = ({ isLoading = false }) => {
	const [message, setMessage] = useState("");
	const plugin = usePlugin();
	const { sendMessage, isAuthenticated } = useCopilotStore();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
		start: 0,
		end: 0,
	});
	const [showFileSuggestion, setShowFileSuggestion] = useState(false);
	const [fileSearchQuery, setFileSearchQuery] = useState("");

	// Parse attachments from the message content
	const attachments = React.useMemo(() => {
		const regex = /\[\[(.*?)\]\]/g;
		const list: string[] = [];
		const seen = new Set<string>();
		let match;
		while ((match = regex.exec(message)) !== null) {
			const filename = match[1];
			if (!seen.has(filename)) {
				seen.add(filename);
				list.push(filename);
			}
		}
		return list;
	}, [message]);

	const updateCursorPosition = () => {
		if (!textareaRef.current) return;

		setCursorPosition({
			start: textareaRef.current.selectionStart,
			end: textareaRef.current.selectionEnd,
		});
	};

	const checkForFileLinkPattern = (value: string, cursorPos: number) => {
		const textBeforeCursor = value.substring(0, cursorPos);
		const openBracketIndex = textBeforeCursor.lastIndexOf("[[");

		if (openBracketIndex >= 0) {
			const closeBracketBeforeCursor = textBeforeCursor
				.substring(openBracketIndex)
				.indexOf("]]");
			if (closeBracketBeforeCursor === -1) {
				const query = textBeforeCursor.substring(openBracketIndex + 2);
				return {
					isInPattern: true,
					query,
					startIndex: openBracketIndex,
				};
			}
		}

		return { isInPattern: false, query: "", startIndex: -1 };
	};

	const handleFileSelect = (file: { path: string; filename: string }) => {
		if (!textareaRef.current) return;

		const textarea = textareaRef.current;
		const value = textarea.value;
		const { start, end } = cursorPosition;

		const { startIndex } = checkForFileLinkPattern(value, start);
		const token = `[[${file.filename}]]`;

		const insertStart = startIndex !== -1 ? startIndex : start;
		const insertEnd = startIndex !== -1 ? end : end;

		const newValue =
			value.substring(0, insertStart) +
			token +
			value.substring(insertEnd);

		setMessage(newValue);
		setShowFileSuggestion(false);

		setTimeout(() => {
			if (textareaRef.current) {
				const newCursorPos = insertStart + token.length;
				textareaRef.current.focus();
				textareaRef.current.setSelectionRange(
					newCursorPos,
					newCursorPos,
				);
				updateCursorPosition();
			}
		}, 0);
	};

	const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setMessage(newValue);

		const cursorPos = e.target.selectionStart;

		const { isInPattern, query } = checkForFileLinkPattern(
			newValue,
			cursorPos,
		);

		if (isInPattern) {
			setFileSearchQuery(query);
			setShowFileSuggestion(true);
		} else {
			setShowFileSuggestion(false);
		}

		setCursorPosition({
			start: e.target.selectionStart,
			end: e.target.selectionEnd,
		});
	};

	// When clicking the attachment icon, open file suggestions (no query); insert [[filename]] on selection
	const handleAttachClick = () => {
		setFileSearchQuery("");
		setShowFileSuggestion(true);
		// 将下拉定位到文本框光标（简单保持现状）
		updateCursorPosition();
	};

	// Remove an attachment from the input (delete all occurrences of [[filename]])
	const handleRemoveAttachment = (filename: string) => {
		const regex = new RegExp(`\\[\\[${filename}\\]\\]`, "g");
		const newValue = message.replace(regex, "");
		setMessage(newValue);
	};

	// Open the corresponding note when clicking an attachment tag
	const openLinkedNote = (note: { path: string; filename: string }) => {
		if (!plugin) return;
		try {
			const file = plugin.app.vault.getAbstractFileByPath(note.path);
			if (file instanceof TFile) {
				const leaves = plugin.app.workspace.getLeavesOfType("markdown");
				const existing = leaves.find((leaf) => {
					type ViewWithFile = { file?: { path?: string } };
					const view = leaf.view as unknown as ViewWithFile;
					const currentPath = view?.file?.path;
					return currentPath === file.path;
				});
				if (existing) {
					plugin.app.workspace.revealLeaf(existing);
					return;
				}

				plugin.app.workspace
					.getLeaf(true)
					.openFile(file)
					.catch((e) => {
						console.error("Failed to open file", e);
						new Notice("无法打开文件: " + note.filename);
					});
			} else {
				plugin.app.workspace.openLinkText(note.filename, "", false);
			}
		} catch (e) {
			console.error("Open note error", e);
			new Notice("打开笔记失败: " + note.filename);
		}
	};

	// Auto-size the textarea based on content (including wrapping), up to 10 lines
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		const style = window.getComputedStyle(el);
		const lineHeight = parseFloat(style.lineHeight || "20");
		const maxHeight = lineHeight * 10; // 10 行上限
		el.style.height = "auto";
		const next = Math.min(el.scrollHeight, maxHeight);
		el.style.height = `${next}px`;
		el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
	}, [message]);

	const extractLinkedNotes = async () => {
		if (!plugin) return null;

		const fileRefs: { path: string; filename: string; content: string }[] =
			[];
		const regex = /\[\[(.*?)\]\]/g;
		let match;

		const processedFiles = new Set<string>();

		while ((match = regex.exec(message)) !== null) {
			const filename = match[1];

			if (processedFiles.has(filename)) continue;

			processedFiles.add(filename);

			const files = plugin.app.vault.getMarkdownFiles();
			const file = files.find((f) => f.basename === filename);

			if (file) {
				try {
					const content = await plugin.app.vault.read(file);
					fileRefs.push({
						path: file.path,
						filename: file.basename,
						content,
					});
				} catch (error) {
					console.error(`Error reading file ${filename}:`, error);
					new Notice(`Could not read file: ${filename}`);
				}
			} else {
				new Notice(`File not found: ${filename}`);
			}
		}

		return fileRefs.length > 0 ? fileRefs : undefined;
	};

	const handleSubmit = async () => {
		if (message.trim() === "" || isLoading || !isAuthenticated) return;

		try {
			const linkedNotes = (await extractLinkedNotes()) || undefined;
			const displayMessage = message;
			const apiMessage = linkedNotes
				? `${message}\n\n${linkedNotes.map((note) => `Referenced content from [[${note.filename}]]:\n${note.content}`).join("\n\n")}`
				: message;

			setMessage("");
			await sendMessage(plugin, apiMessage, displayMessage, linkedNotes);
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (!plugin) return;

		const invertBehavior = plugin.settings.invertEnterSendBehavior;

		if (e.key === "Enter" && !showFileSuggestion) {
			if (invertBehavior) {
				if (e.shiftKey) {
					e.preventDefault();
					handleSubmit();
				}
			} else {
				if (!e.shiftKey) {
					e.preventDefault();
					handleSubmit();
				}
			}
		}

		updateCursorPosition();
	};

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.addEventListener("click", updateCursorPosition);
			textareaRef.current.addEventListener(
				"select",
				updateCursorPosition,
			);
		}

		return () => {
			if (textareaRef.current) {
				textareaRef.current.removeEventListener(
					"click",
					updateCursorPosition,
				);
				textareaRef.current.removeEventListener(
					"select",
					updateCursorPosition,
				);
			}
		};
	}, []);

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			{/* 第一部分：附件栏 */}
			<div className={concat(BASE_CLASSNAME, "attachments-bar")}>
				<button
					className={concat(BASE_CLASSNAME, "attach-button")}
					onClick={handleAttachClick}
					disabled={!isAuthenticated || isLoading}
					aria-label="Add attachment"
				>
					<ObsidianIcon name="lucide-paperclip" />
				</button>
				{attachments.map((name) => (
					<span
						key={name}
						className={concat(BASE_CLASSNAME, "attachment-tag")}
						onClick={() => {
							if (!plugin) return;
							const files = plugin.app.vault.getMarkdownFiles();
							const file = files.find((f) => f.basename === name);
							if (file) {
								openLinkedNote({
									path: file.path,
									filename: file.basename,
								});
							} else {
								new Notice("File not found: " + name);
							}
						}}
					>
						{name}
						<button
							className={cx(
								concat(BASE_CLASSNAME, "attachment-remove"),
							)}
							onClick={(e) => {
								e.stopPropagation();
								handleRemoveAttachment(name);
							}}
							aria-label={`Remove ${name}`}
						>
							<ObsidianIcon name="lucide-x" />
						</button>
					</span>
				))}
			</div>

			{/* 第二部分：可自增高度输入框 */}
			<div
				className={concat(BASE_CLASSNAME, "input-area")}
				style={{ position: "relative" }}
			>
				<textarea
					ref={textareaRef}
					className={cx(
						"setting-item-input",
						concat(BASE_CLASSNAME, "input"),
					)}
					value={message}
					onChange={handleMessageChange}
					onKeyDown={handleKeyDown}
					placeholder="Ask GitHub Copilot something... Use [[]] to link notes"
					disabled={isLoading || !isAuthenticated}
					rows={1}
					style={{
						resize: "none",
					}}
				/>
				{showFileSuggestion && (
					<FileSuggestion
						query={fileSearchQuery}
						onSelect={handleFileSelect}
						onClose={() => setShowFileSuggestion(false)}
						plugin={plugin}
					/>
				)}
			</div>

			{/* 第三部分：模型选择器与发送按钮 */}
			<div className={concat(BASE_CLASSNAME, "actions-bar")}>
				<ModelSelector isAuthenticated={isAuthenticated} />
				<button
					className={concat(BASE_CLASSNAME, "send-button")}
					onClick={handleSubmit}
					disabled={
						isLoading || message.trim() === "" || !isAuthenticated
					}
					aria-label="Send"
				>
					<ObsidianIcon
						name={
							isLoading
								? "lucide-loader"
								: "lucide-send-horizontal"
						}
					/>
				</button>
			</div>
		</div>
	);
};

export default Input;
