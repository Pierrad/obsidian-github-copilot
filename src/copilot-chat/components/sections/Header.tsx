import React, { useState } from "react";
import { concat } from "../../../utils/style";
import { usePlugin } from "../../hooks/usePlugin";
import { useCopilotStore } from "../../store/store";
import ConversationSelector from "./ConversationSelector";

const BASE_CLASSNAME = "copilot-chat-header";

const Header: React.FC = () => {
  const plugin = usePlugin();
  const {
    clearMessages,
    activeConversationId,
    deleteConversation,
    createConversation,
    selectedModel,
  } = useCopilotStore();
  const [isConversationSelectorOpen, setIsConversationSelectorOpen] =
    useState(false);

  const handleClearChat = () => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      if (activeConversationId && plugin) {
        deleteConversation(plugin, activeConversationId);
        clearMessages();
        createConversation(plugin, selectedModel);
      } else {
        clearMessages();
      }
    }
  };

  const handleNewConversation = () => {
    if (plugin) {
      createConversation(plugin, selectedModel);
      clearMessages();
    }
  };

  const toggleConversationSelector = () => {
    setIsConversationSelectorOpen(!isConversationSelectorOpen);
  };

  return (
    <div className={concat(BASE_CLASSNAME, "container")}>
      <div className={concat(BASE_CLASSNAME, "title")}>Chat</div>
      <div className={concat(BASE_CLASSNAME, "actions")}>
        <button
          className={concat(BASE_CLASSNAME, "action-button")}
          onClick={handleNewConversation}
          title="Start new conversation"
          accessKey="n"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
        </button>
        <button
          className={concat(BASE_CLASSNAME, "action-button")}
          onClick={toggleConversationSelector}
          title="View conversation history"
          accessKey="h"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </button>
        <button
          className={concat(BASE_CLASSNAME, "action-button")}
          onClick={handleClearChat}
          title="Delete this conversation"
          accessKey="d"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <ConversationSelector
        isOpen={isConversationSelectorOpen}
        onClose={() => setIsConversationSelectorOpen(false)}
      />
    </div>
  );
};

export default Header;
