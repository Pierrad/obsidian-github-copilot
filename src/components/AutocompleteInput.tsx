import React, { useState, useEffect } from "react";
import CopilotPlugin from "../main";

interface AutocompleteInputProps {
	title: string;
	description: string;
	values: string[];
	onChange: (values: string[]) => void;
	plugin: CopilotPlugin;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = (props) => {
	const { title, description, values, onChange, plugin } = props;
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [options, setOptions] = useState<{ value: string; label: string }[]>(
		[],
	);

	useEffect(() => {
		const all = plugin.app.vault.getAllLoadedFiles();
		setOptions(
			all.map((file) => {
				return {
					value: file.path,
					label: file.path,
				};
			}),
		);
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
					className="setting-item-input"
					onFocus={() => setShowSuggestions(true)}
					onBlur={() => setShowSuggestions(false)}
				/>
				{showSuggestions && (
					<div className="suggestion-container">
						<div className="suggestion">
							{options.map((option) => (
								<div className="suggestion-item">
									{option.label}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AutocompleteInput;
