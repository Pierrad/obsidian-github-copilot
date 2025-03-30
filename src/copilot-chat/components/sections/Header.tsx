import React from "react";
import { concat } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";

const BASE_CLASSNAME = "copilot-chat-header";

const Header: React.FC = () => {
	const { clearMessages } = useCopilotStore();

	const handleClearChat = () => {
		if (confirm("Are you sure you want to clear the chat history?")) {
			clearMessages();
		}
	};

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div className={concat(BASE_CLASSNAME, "title")}>Chat</div>
			<div className={concat(BASE_CLASSNAME, "actions")}>
				<button
					className={concat(BASE_CLASSNAME, "action-button")}
					onClick={handleClearChat}
					title="Clear chat history"
				>
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
						<path d="M3 6h18"></path>
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
					</svg>
				</button>
			</div>
		</div>
	);
};

export default Header;
