import React, { useState, useEffect, useCallback } from "react";

interface HotkeyInputProps {
	title: string;
	description: string;
	value: string;
	onChange: (value: string) => void;
}

const HotKeyModifier = {
	Shift: "Shift",
	Alt: "Alt",
	Control: "Control",
	Meta: "Meta",
	Cmd: "Cmd",
};

const HotkeyInput: React.FC<HotkeyInputProps> = (props) => {
	const { title, description, value, onChange } = props;
	const [hotkey, setHotkey] = useState(value);
	const [keyListenerActive, setKeyListenerActive] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (keyListenerActive) {
				event.preventDefault();
				const key = event.key;
				const newHotkey = hotkey + key + "-";
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
		// here you can add the logic to register the hotkey in your app
	};

	const handleRemoveHotkey = useCallback(() => {
		setHotkey("");
	}, []);

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
				<button onClick={handleRemoveHotkey}>X</button>
			</div>
		</div>
	);
};

export default HotkeyInput;
