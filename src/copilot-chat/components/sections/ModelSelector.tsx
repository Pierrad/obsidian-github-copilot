import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";

const BASE_CLASSNAME = "copilot-chat-model-selector";

interface ModelSelectorProps {
	isAuthenticated: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isAuthenticated }) => {
	const plugin = usePlugin();
	const { selectedModel, availableModels, setSelectedModel } =
		useCopilotStore();

	const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const modelValue = e.target.value;
		const selectedModelOption = availableModels.find(
			(model) => model.value === modelValue,
		);

		if (selectedModelOption) {
			setSelectedModel(plugin, selectedModelOption);
		}
	};

	// Keyboard shortcuts for model selection
	const handleFocusModelSelector = () => {
		if (!isAuthenticated) return;
		const selectElement = document.querySelector(
			`.${BASE_CLASSNAME}-select`,
		) as HTMLSelectElement;
		if (selectElement) {
			selectElement.focus();
		}
	};

	// Alt+Shift+M to focus model selector
	useHotkeys(
		"alt+shift+m",
		handleFocusModelSelector,
		{
			enabled: isAuthenticated,
			description: "Focus model selector",
		},
		[isAuthenticated],
	);

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<select
				className={cx(concat(BASE_CLASSNAME, "select"))}
				value={selectedModel.value}
				onChange={handleModelChange}
				disabled={!isAuthenticated}
				title="Select AI model (alt+shift+m)"
			>
				{availableModels.map((model) => (
					<option key={model.value} value={model.value}>
						{model.label}
					</option>
				))}
			</select>
		</div>
	);
};

export default ModelSelector;
