import React from "react";
import { Notice } from "obsidian";
import { concat, cx } from "../../../utils/style";
import { copilotIcon } from "../../../assets/copilot";
import { usePlugin } from "../../hooks/usePlugin";
import { useAuthStore } from "../../store/store";

const BASE_CLASSNAME = "copilot-chat-auth";

const Auth: React.FC = () => {
	const plugin = usePlugin();

	const deviceCodeData = useAuthStore((state) => state.deviceCodeData);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoadingDeviceCode = useAuthStore(
		(state) => state.isLoadingDeviceCode,
	);
	const isLoadingPAT = useAuthStore((state) => state.isLoadingPAT);

	const fetchDeviceCode = useAuthStore((state) => state.fetchDeviceCode);
	const fetchPAT = useAuthStore((state) => state.fetchPAT);

	const handleRequestCode = async () => {
		if (plugin) {
			try {
				await fetchDeviceCode(plugin);
			} catch (error) {
				console.error("Error requesting code:", error);
			}
		}
	};

	const handleCopyCode = () => {
		if (deviceCodeData) {
			navigator.clipboard.writeText(deviceCodeData.user_code);
			new Notice("Code copied to clipboard");
		} else {
			new Notice("No device code data available");
		}
	};

	const handleValidateAuth = async () => {
		if (deviceCodeData && plugin) {
			try {
				await fetchPAT(plugin, deviceCodeData.device_code);
			} catch (error) {
				console.error("Error validating auth:", error);
				new Notice("Authentication failed. Please try again.");
			}
		} else {
			new Notice("No device code data available");
		}
	};

	return (
		<div className={cx(concat(BASE_CLASSNAME, "container"))}>
			<div
				dangerouslySetInnerHTML={{ __html: copilotIcon }}
				className={cx(
					concat(BASE_CLASSNAME, "icon"),
					"copilot-big-icon",
				)}
			/>
			{!isAuthenticated && (
				<>
					<h1
						className={cx(
							concat(BASE_CLASSNAME, "title"),
							"copilot-chat-title",
						)}
					>
						Authentication
					</h1>
					<p
						className={cx(
							concat(BASE_CLASSNAME, "text"),
							"copilot-chat-subtitle",
						)}
					>
						Please log in to access copilot chat features.
					</p>
					{!deviceCodeData && (
						<button
							onClick={handleRequestCode}
							className={cx(
								concat(BASE_CLASSNAME, "button"),
								"mod-cta",
							)}
							disabled={isLoadingDeviceCode}
						>
							{isLoadingDeviceCode
								? "Loading..."
								: "Request code"}
						</button>
					)}
					{deviceCodeData && (
						<div className={cx(concat(BASE_CLASSNAME, "code"))}>
							<a
								href={deviceCodeData.verification_uri}
								target="_blank"
								rel="noopener noreferrer"
							>
								You can click here to open the verification page
							</a>
							<p
								className={cx(
									concat(BASE_CLASSNAME, "code-text"),
								)}
							>
								Your code: {deviceCodeData.user_code}
							</p>
							<div
								className={cx(
									concat(BASE_CLASSNAME, "code-actions"),
								)}
							>
								<button onClick={handleCopyCode}>
									Copy code
								</button>
								<button
									onClick={handleRequestCode}
									disabled={isLoadingDeviceCode}
								>
									{isLoadingDeviceCode
										? "Loading..."
										: "Request new code"}
								</button>
								<button
									onClick={handleValidateAuth}
									className="mod-cta"
									disabled={isLoadingPAT}
								>
									{isLoadingPAT
										? "Validating..."
										: "Click here once you have logged in on the verification page"}
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Auth;
