import React, { useEffect } from "react";
import Auth from "../components/sections/Auth";
import { usePlugin } from "../hooks/usePlugin";
import { useAuthStore } from "../store/store";

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const plugin = usePlugin();
	const init = useAuthStore((state) => state.init);
	const isAuth = useAuthStore((state) => state.isAuthenticated);
	const reset = useAuthStore((state) => state.reset);

	useEffect(() => {
		if (plugin) {
			init(plugin);
		}
	}, [plugin, init]);

	return (
		<div className="copilot-chat-container">
			{isAuth ? children : <Auth />}
			<button
				onClick={() => {
					if (plugin) reset(plugin);
				}}
			>
				Reset
			</button>
		</div>
	);
};

export default MainLayout;
