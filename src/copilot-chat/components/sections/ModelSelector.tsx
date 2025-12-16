import React from "react";
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

  return (
    <div className={concat(BASE_CLASSNAME, "container")}>
      <select
        className={cx(concat(BASE_CLASSNAME, "select"))}
        value={selectedModel.value}
        onChange={handleModelChange}
        disabled={!isAuthenticated}
        accessKey="/"
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
