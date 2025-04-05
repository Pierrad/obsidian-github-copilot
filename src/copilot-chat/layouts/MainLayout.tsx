import React, { useEffect } from "react";
import Auth from "../components/sections/Auth";
import { usePlugin } from "../hooks/usePlugin";
import { useAuthStore, useCopilotStore } from "../store/store";

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const plugin = usePlugin();
	const initAuthService = useAuthStore((state) => state.initAuthService);
	const initMessageService = useCopilotStore(
		(state) => state.initMessageService,
	);
	const initConversationService = useCopilotStore(
		(state) => state.initConversationService,
	);
	const isAuth = useAuthStore((state) => state.isAuthenticated);
	// const reset = useAuthStore((state) => state.reset);

	useEffect(() => {
		if (plugin) {
			initAuthService(plugin);
			initMessageService(plugin);
			initConversationService(plugin);
		}
	}, [plugin, initAuthService, initMessageService, initConversationService]);

	return (
		<div className="copilot-chat-container">
			{isAuth ? children : <Auth />}
			{/* <button
				onClick={() => {
					if (plugin) reset(plugin);
				}}
			>
				Reset
			</button> */}
		</div>
	);
};

export default MainLayout;
