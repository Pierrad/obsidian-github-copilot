import React, { useState, useEffect, useRef } from "react";
import CopilotPlugin from "../main";
import { TAbstractFile } from "obsidian";

interface AutocompleteInputProps {
	title: string;
	description: string;
	values: string[];
	onSave: (values: string[]) => void;
	plugin: CopilotPlugin;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = (props) => {
	const { title, description, values, plugin, onSave } = props;
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [currentValues, setCurrentValues] = useState<string[]>(values);
	const [allFiles, setAllFiles] = useState<TAbstractFile[]>([]);
	const [options, setOptions] = useState<{ value: string; label: string }[]>(
		[],
	);

	const suggestionContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const all = plugin.app.vault.getAllLoadedFiles();
		setAllFiles(all);
		setOptions(
			all.map((file) => {
				return {
					value: file.path,
					label: file.path,
				};
			}),
		);
	}, []);

	const onChange = (value: string) => {
		if (currentValues.includes(value)) {
			setCurrentValues(currentValues.filter((v) => v !== value));
		} else {
			setCurrentValues([...currentValues, value]);
		}
	};

	return (
		<>
			<p className="copilot-settings-note">
				No suggestions will be generated for the files and folders
				listed below:
			</p>
			{currentValues.map((value, i) => (
				<div
					className="copilot-settings-exclude-item"
					key={i}
					onClick={() => {
						onChange(value);
					}}
				>
					<span>{value}</span>
					<span className="copilot-settings-exclude-item-remove">
						&times;
					</span>
				</div>
			))}
			{currentValues.length === 0 && (
				<i className="copilot-settings-note">
					No files or folders are excluded for the moment.
				</i>
			)}
			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">{title}</div>
					<div className="setting-item-description">
						{description}
					</div>
				</div>
				<div className="setting-item-control copilot-settings-item-control">
					<input
						type="text"
						className="setting-item-input"
						onChange={(e) => {
							const value = e.target.value;
							setOptions(
								allFiles
									.filter((file) =>
										file.path
											.toLowerCase()
											.includes(value.toLowerCase()),
									)
									.map((file) => {
										return {
											value: file.path,
											label: file.path,
										};
									}),
							);
						}}
						onFocus={() => setShowSuggestions(true)}
						onBlur={(e) => {
							if (
								suggestionContainerRef.current &&
								!suggestionContainerRef.current.contains(
									e.relatedTarget,
								)
							) {
								setShowSuggestions(false);
							}
						}}
					/>
					{showSuggestions && (
						<div
							className="suggestion-container copilot-settings-suggestion-container"
							ref={suggestionContainerRef}
						>
							<div className="suggestion">
								{options.map((option, i) => (
									<div
										className={
											"suggestion-item copilot-settings-suggestion-item" +
											(currentValues.includes(
												option.value,
											)
												? " copilot-settings-suggestion-item-active"
												: "")
										}
										key={i}
										onMouseDown={(e) => {
											e.preventDefault();
											onChange(option.value);
										}}
									>
										{option.label}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			<button
				className="mod-cta copilot-settings-save-button"
				onClick={() => onSave(currentValues)}
			>
				Save exclude folders and files
			</button>
		</>
	);
};

export default AutocompleteInput;
