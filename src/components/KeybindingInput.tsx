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

	const [pendingFirstKey, setPendingFirstKey] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!keyListenerActive) return;

			// Only intercept modifier keys and printable/named keys that make
			// sense as hotkey components. Navigation keys like Tab that move
			// focus between settings fields must still work normally.
			const navigationKeys = ["Tab", "Escape"];
			if (navigationKeys.includes(event.key)) return;

			event.preventDefault();
			const key = event.key;

			// On the first real keydown after focus, start fresh.
			const base = pendingFirstKey ? "" : hotkey;

			if (key in modifierMap) {
				const newHotkey = base + modifierMap[key];
				setHotkey(newHotkey);
				onChange(newHotkey);
				setPendingFirstKey(false);
				return;
			}

			const finalKey =
				format === "hotkeys-hook" ? key.toLowerCase() : key;
			const newHotkey = base + finalKey;
			setHotkey(newHotkey);
			onChange(newHotkey);
			setPendingFirstKey(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		keyListenerActive,
		hotkey,
		pendingFirstKey,
		onChange,
		format,
		modifierMap,
	]);

	const handleInputFocus = () => {
		setPendingFirstKey(true);
		setKeyListenerActive(true);
	};

	const handleInputBlur = () => {
		setKeyListenerActive(false);
		setPendingFirstKey(false);
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
