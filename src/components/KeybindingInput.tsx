import React, { useState, useEffect, useCallback } from "react";

const KeybindingModifierCodeMirror: Record<string, string> = {
	Shift: "Shift-",
	Alt: "Alt-",
	Control: "Ctrl-",
	Meta: navigator.platform.includes("Mac") ? "Cmd-" : "Meta-",
	Cmd: "Cmd-",
};

const KeybindingModifierHotkeysHook: Record<string, string> = {
	Shift: "shift+",
	Alt: "alt+",
	Control: "ctrl+",
	Meta: "meta+",
	Cmd: "meta+",
};

export type KeybindingFormat = "codemirror" | "hotkeys-hook";

interface KeybindingInputProps {
	title: string;
	description: string;
	value: string;
	onChange: (value: string) => void;
	defaultValue?: string;
	format?: KeybindingFormat;
}

const KeybindingInput: React.FC<KeybindingInputProps> = ({
	title,
	description,
	value,
	onChange,
	defaultValue,
	format = "codemirror",
}) => {
	const [hotkey, setHotkey] = useState(value);
	const [keyListenerActive, setKeyListenerActive] = useState(false);

	const modifierMap =
		format === "hotkeys-hook"
			? KeybindingModifierHotkeysHook
			: KeybindingModifierCodeMirror;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!keyListenerActive) return;

			event.preventDefault();
			const key = event.key;

			if (key in modifierMap) {
				const newHotkey = hotkey + modifierMap[key];
				setHotkey(newHotkey);
				onChange(newHotkey);
				return;
			}

			const finalKey =
				format === "hotkeys-hook" ? key.toLowerCase() : key;
			const newHotkey = hotkey + finalKey;
			setHotkey(newHotkey);
			onChange(newHotkey);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [keyListenerActive, hotkey, onChange, format, modifierMap]);

	const handleInputFocus = () => {
		setHotkey("");
		onChange("");
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
		setHotkey(defaultValue ?? "");
		onChange(defaultValue ?? "");
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
				<button type="button" onClick={handleRemoveHotkey}>
					Clear
				</button>
				<button type="button" onClick={handleResetHotkey}>
					Reset
				</button>
			</div>
		</div>
	);
};

export default KeybindingInput;
