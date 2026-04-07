import React, { useEffect, useRef, useState } from "react";
import { concat, cx } from "../../../utils/style";
import { useCopilotStore } from "../../store/store";
import { usePlugin } from "../../hooks/usePlugin";
import {
	formatReasoningEffortLabel,
	getModelCompactMeta,
	getModelDisplayLabel,
	getModelMetaSummary,
	groupModelsForPicker,
	ReasoningEffort,
	supportsReasoningEffort,
} from "../../models";

const BASE_CLASSNAME = "copilot-chat-model-selector";

interface ModelSelectorProps {
	isAuthenticated: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isAuthenticated }) => {
	const plugin = usePlugin();
	const {
		selectedModel,
		availableModels,
		reasoningEffort,
		setSelectedModel,
		setReasoningEffort,
	} =
		useCopilotStore();
	const modelMenuRef = useRef<HTMLDivElement>(null);
	const effortMenuRef = useRef<HTMLDivElement>(null);
	const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
	const [isEffortMenuOpen, setIsEffortMenuOpen] = useState(false);

	const reasoningEffortSupported = supportsReasoningEffort(selectedModel);
	const modelGroups = groupModelsForPicker(availableModels);
	const selectedModelCompactMeta = getModelCompactMeta(selectedModel);

	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (
				modelMenuRef.current &&
				!modelMenuRef.current.contains(event.target as Node)
			) {
				setIsModelMenuOpen(false);
			}

			if (
				effortMenuRef.current &&
				!effortMenuRef.current.contains(event.target as Node)
			) {
				setIsEffortMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, []);

	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div className={concat(BASE_CLASSNAME, "menu-group")} ref={modelMenuRef}>
				<button
					type="button"
					className={cx(concat(BASE_CLASSNAME, "button"))}
					onClick={() =>
						setIsModelMenuOpen((current) =>
							isAuthenticated ? !current : false,
						)
					}
					disabled={!isAuthenticated}
				>
					<div className={concat(BASE_CLASSNAME, "button-main")}>
						<span className={concat(BASE_CLASSNAME, "button-label")}>
							{getModelDisplayLabel(selectedModel)}
						</span>
						{selectedModelCompactMeta && (
							<span className={concat(BASE_CLASSNAME, "button-meta")}>
								{selectedModelCompactMeta}
							</span>
						)}
					</div>
				</button>
				{isModelMenuOpen && (
					<div className={concat(BASE_CLASSNAME, "menu")}>
						{modelGroups.map((group) => (
							<div key={group.label} className={concat(BASE_CLASSNAME, "section")}>
								<div className={concat(BASE_CLASSNAME, "section-title")}>
									{group.label}
								</div>
								{group.models.map((model) => {
									const compactMeta = getModelCompactMeta(model);

									return (
										<button
											type="button"
											key={model.value}
											className={cx(
												concat(BASE_CLASSNAME, "option"),
												model.value === selectedModel.value
													? concat(BASE_CLASSNAME, "option-active")
													: "",
											)}
											onClick={() => {
												setSelectedModel(plugin, model);
												setIsModelMenuOpen(false);
											}}
										>
											<span className={concat(BASE_CLASSNAME, "option-label")}>
												{getModelDisplayLabel(model)}
											</span>
											{compactMeta && (
												<span className={concat(BASE_CLASSNAME, "option-meta")}>
													{compactMeta}
												</span>
											)}
										</button>
									);
								})}
							</div>
						))}
					</div>
				)}
			</div>
			<div className={concat(BASE_CLASSNAME, "meta")}>
				<div className={concat(BASE_CLASSNAME, "meta-text")}>
					{getModelMetaSummary(selectedModel) || "No model metadata available"}
				</div>
				<div className={concat(BASE_CLASSNAME, "effort-group")} ref={effortMenuRef}>
					<button
						type="button"
						className={cx(concat(BASE_CLASSNAME, "effort-button"))}
						onClick={() =>
							setIsEffortMenuOpen((current) =>
								reasoningEffortSupported && isAuthenticated
									? !current
									: false,
							)
						}
						disabled={!isAuthenticated || !reasoningEffortSupported}
					>
						Reasoning: {formatReasoningEffortLabel(reasoningEffort)}
					</button>
					{isEffortMenuOpen && reasoningEffortSupported && (
						<div className={concat(BASE_CLASSNAME, "effort-menu")}>
							{(["low", "medium", "high"] as ReasoningEffort[]).map(
								(effort) => (
									<button
										type="button"
										key={effort}
										className={cx(
											concat(BASE_CLASSNAME, "effort-option"),
											effort === reasoningEffort
												? concat(BASE_CLASSNAME, "effort-option-active")
												: "",
										)}
										onClick={() => {
											setReasoningEffort(plugin, effort);
											setIsEffortMenuOpen(false);
										}}
									>
										{formatReasoningEffortLabel(effort)}
									</button>
								),
							)}
						</div>
					)}
				</div>
			</div>
			{!reasoningEffortSupported && (
				<div className={concat(BASE_CLASSNAME, "effort-note")}>
					Reasoning effort is currently exposed only for GPT-5 family and compatible reasoning models.
				</div>
			)}
		</div>
	);
};

export default ModelSelector;
