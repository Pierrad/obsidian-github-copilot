import { useContext } from "react";
import { PluginContext } from "../views/ChatView";
import CopilotPlugin from "../../main";

export const usePlugin = (): CopilotPlugin | undefined => {
	return useContext(PluginContext);
};
