import React from "react";
import { concat, cx } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-input";

const Input: React.FC = () => {
	const [inputValue, setInputValue] = React.useState<string>("");

	const handleInputChange = (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
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
			<textarea
				value={inputValue}
				onChange={handleInputChange}
				className={cx(
					"setting-item-input",
					concat(BASE_CLASSNAME, "input"),
				)}
				placeholder="Type your message..."
				rows={3}
				style={{ resize: "none", width: "100%" }}
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

export default Input;
