import React, { useState, KeyboardEvent } from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";
import ModelSelector from "./ModelSelector";

const BASE_CLASSNAME = "copilot-chat-input";

interface InputProps {
	isLoading?: boolean;
}

const Input: React.FC<InputProps> = ({ isLoading = false }) => {
	const [message, setMessage] = useState("");
	const plugin = usePlugin();
	const { sendMessage, isAuthenticated } = useCopilotStore();

	const handleSubmit = async () => {
		if (message.trim() === "" || isLoading || !isAuthenticated) return;

		try {
			await sendMessage(plugin, message);
			setMessage("");
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<ModelSelector isAuthenticated={isAuthenticated} />
			<div className={concat(BASE_CLASSNAME, "input-container")}>
				<textarea
					className={cx(
						"setting-item-input",
						concat(BASE_CLASSNAME, "input"),
					)}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask GitHub Copilot something..."
					disabled={isLoading || !isAuthenticated}
				/>
				<button
					className={cx("mod-cta", concat(BASE_CLASSNAME, "button"))}
					onClick={handleSubmit}
					disabled={
						isLoading || message.trim() === "" || !isAuthenticated
					}
				>
					{isLoading ? "Thinking..." : "Send"}
				</button>
			</div>
		</div>
	);
};

export default Input;
