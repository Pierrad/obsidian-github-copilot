import React, { useState, useEffect, useCallback } from "react";

const KeybindingModifier = {
	Shift: "Shift-",
	Alt: "Alt-",
	Control: "Ctrl-",
	Meta: "Meta-",
	Cmd: "Cmd-",
};

interface KeybindingInputProps {
	title: string;
	description: string;
	value: string;
	onChange: (value: string) => void;
	defaultValue?: string;
}

const KeybindingInput: React.FC<KeybindingInputProps> = (props) => {
	const { title, description, value, onChange, defaultValue } = props;
	const [hotkey, setHotkey] = useState(value);
	const [keyListenerActive, setKeyListenerActive] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (keyListenerActive) {
				event.preventDefault();
				const key = event.key;
				if (Object.keys(KeybindingModifier).includes(key)) {
					const newHotkey =
						hotkey +
						KeybindingModifier[
							key as keyof typeof KeybindingModifier
						];
					setHotkey(newHotkey);
					onChange(newHotkey);
					return;
				}
				const newHotkey = hotkey + key;
				setHotkey(newHotkey);
				onChange(newHotkey);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [keyListenerActive, hotkey]);

	const handleInputFocus = () => {
		setKeyListenerActive(true);
	};

	const handleInputBlur = () => {
		setKeyListenerActive(false);
	};

	const handleRemoveHotkey = useCallback(() => {
		setHotkey("");
		onChange("");
	}, [onChange]);

	const handleResetHotkey = useCallback(() => {
		setHotkey(defaultValue || "");
		onChange(defaultValue || "");
	}, [defaultValue, onChange]);

	return (
		<div className="setting-item">
			<div className="setting-item-info">
				<div className="setting-item-name">{title}</div>
				<div className="setting-item-description">{description}</div>
			</div>
			<div className="setting-item-control">
				<input
					type="text"
					value={hotkey}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					readOnly
				/>
				<button onClick={handleRemoveHotkey}>Clear</button>
				<button onClick={handleResetHotkey}>Reset</button>
			</div>
		</div>
	);
};

export default KeybindingInput;
