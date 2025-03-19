import React from "react";
import { concat, cx } from "../../utils/style";

const BASE_CLASSNAME = "copilot-chat-input";

const ChatInput: React.FC = () => {
	const [inputValue, setInputValue] = React.useState<string>("");

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("Submitted:", inputValue);
		setInputValue("");
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={concat(BASE_CLASSNAME, "form")}
		>
			<input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				className={cx(
					"setting-item-input",
					concat(BASE_CLASSNAME, "input"),
				)}
				placeholder="Type your message..."
			/>
			<button
				type="submit"
				className={cx("mod-cta", concat(BASE_CLASSNAME, "button"))}
			>
				Send
			</button>
		</form>
	);
};

export default ChatInput;
