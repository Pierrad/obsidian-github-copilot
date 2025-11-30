import React, { useEffect, useRef, useState } from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

const BASE_CLASSNAME = "copilot-chat-model-selector";

interface ModelSelectorProps {
	isAuthenticated: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isAuthenticated }) => {
	const plugin = usePlugin();
	const { selectedModel, availableModels, setSelectedModel } =
		useCopilotStore();

	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (value: string) => {
		const selectedModelOption = availableModels.find(
			(model) => model.value === value,
		);
		if (selectedModelOption) {
			setSelectedModel(plugin, selectedModelOption);
			setOpen(false);
		}
	};

	return (
		<div className={concat(BASE_CLASSNAME, "container")} ref={containerRef}>
			<button
				className={cx(concat(BASE_CLASSNAME, "button"))}
				disabled={!isAuthenticated}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label="Select model"
			>
				<span style={{ whiteSpace: "nowrap" }}>
					{selectedModel.label}
				</span>
				<ObsidianIcon
					name="lucide-chevron-down"
					style={{ marginTop: "2px" }}
				/>
			</button>

			{open && (
				<div className={concat(BASE_CLASSNAME, "menu")} role="listbox">
					{availableModels.map((model) => (
						<button
							key={model.value}
							role="option"
							aria-selected={model.value === selectedModel.value}
							className={cx(
								concat(BASE_CLASSNAME, "menu-item"),
								model.value === selectedModel.value
									? concat(
										BASE_CLASSNAME,
										"menu-item-selected",
									)
									: "",
							)}
							onClick={() => handleSelect(model.value)}
						>
							{model.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default ModelSelector;
