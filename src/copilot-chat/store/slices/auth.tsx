import { StateCreator } from "zustand";
import { Notice } from "obsidian";
import CopilotPlugin from "../../../main";
import { CopilotChatSettings } from "../../../settings/CopilotPluginSettingTab";
import SecureCredentialManager from "../../../helpers/SecureCredentialManager";
import {
	fetchDeviceCode,
	fetchPAT,
	fetchToken,
	DeviceCodeResponse,
	PATResponse,
	TokenResponse,
} from "../../api";
import Logger from "../../../helpers/Logger";

export interface AuthSlice {
	deviceCode: CopilotChatSettings["deviceCode"];
	pat: CopilotChatSettings["pat"];
	accessToken: CopilotChatSettings["accessToken"];
	isAuthenticated: boolean;
	isLoadingDeviceCode: boolean;
	isLoadingPAT: boolean;
	isLoadingToken: boolean;
	deviceCodeData: DeviceCodeResponse | null;
	storageInfo: { method: string; secure: boolean } | null;

	initAuthService: (plugin: CopilotPlugin) => void;
	checkAndRefreshToken: (plugin: CopilotPlugin) => Promise<string | null>;

	setDeviceCode: (plugin: CopilotPlugin, code: string) => void;
	setPAT: (plugin: CopilotPlugin, pat: string) => void;
	setAccessToken: (
		plugin: CopilotPlugin,
		token: CopilotChatSettings["accessToken"],
	) => void;

	fetchDeviceCode: (
		plugin: CopilotPlugin,
	) => Promise<DeviceCodeResponse | null>;
	fetchPAT: (
		plugin: CopilotPlugin,
		deviceCode: string,
	) => Promise<PATResponse | null>;
	fetchToken: (
		plugin: CopilotPlugin,
		pat: string,
	) => Promise<TokenResponse | null>;

	reset: (plugin: CopilotPlugin) => void;
	migrateCredentialsToSecureStorage: (
		plugin: CopilotPlugin,
	) => Promise<boolean>;
	loadCredentialsFromSecureStorage: (plugin: CopilotPlugin) => Promise<void>;
}

const defaultChatSettings: CopilotChatSettings = {
	deviceCode: null,
	pat: null,
	accessToken: {
		token: null,
		expiresAt: 0,
	},
};

const isTokenExpired = (expiresAt: number): boolean => {
	return Date.now() >= expiresAt * 1000;
};

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
	deviceCode: null,
	pat: null,
	accessToken: {
		token: null,
		expiresAt: 0,
	},
	isAuthenticated: false,
	isLoadingDeviceCode: false,
	isLoadingPAT: false,
	isLoadingToken: false,
	deviceCodeData: null,
	storageInfo: null,

	initAuthService: async (plugin: CopilotPlugin) => {
		const secureManager = SecureCredentialManager.getInstance();

		// Initialize storage info
		set({
			storageInfo: secureManager.getStorageInfo(),
		});

		const chatSettings =
			plugin.settings.chatSettings || defaultChatSettings;

		// Check if we need to migrate from plain text to secure storage
		const hasPlainTextCredentials = !!(
			chatSettings.deviceCode ||
			chatSettings.pat ||
			chatSettings.accessToken?.token
		);

		const hasSecureCredentials = await secureManager.hasCredentials(
			plugin.app,
		);

		if (hasPlainTextCredentials && !hasSecureCredentials) {
			Logger.getInstance().log(
				"[AuthSlice] Detected plain text credentials, initiating migration...",
			);
			const migrationSuccess =
				await get().migrateCredentialsToSecureStorage(plugin);

			if (migrationSuccess) {
				// Clear plain text credentials from data.json after successful migration
				if (plugin.settings.chatSettings) {
					plugin.settings.chatSettings.deviceCode = null;
					plugin.settings.chatSettings.pat = null;
					plugin.settings.chatSettings.accessToken = {
						token: null,
						expiresAt: 0,
					};
					await plugin.saveData(plugin.settings);
				}
			}
		}

		// Load credentials from secure storage
		await get().loadCredentialsFromSecureStorage(plugin);

		// Check if token needs refreshing
		const { pat, accessToken } = get();
		if (
			pat &&
			(!accessToken?.token || isTokenExpired(accessToken?.expiresAt || 0))
		) {
			try {
				await get().fetchToken(plugin, pat);
			} catch (error) {
				console.error("Failed to refresh token during init:", error);
			}
		} else {
			const { deviceCode, pat, accessToken } = get();
			set({
				isAuthenticated: !!(
					deviceCode &&
					pat &&
					accessToken?.token &&
					!isTokenExpired(accessToken?.expiresAt || 0)
				),
			});
		}
	},

	checkAndRefreshToken: async (plugin: CopilotPlugin) => {
		const { accessToken, pat } = get();

		if (!accessToken.token || isTokenExpired(accessToken.expiresAt || 0)) {
			Logger.getInstance().log(
				"Token expired or about to expire, refreshing...",
			);

			if (!pat) {
				Logger.getInstance().error(
					"Cannot refresh token: No PAT available",
				);
				return null;
			}

			try {
				const data = await get().fetchToken(plugin, pat);
				return data?.token || null;
			} catch (error) {
				Logger.getInstance().error(`Failed to refresh token: ${error}`);
				return null;
			}
		}

		return accessToken.token;
	},

	setDeviceCode: async (plugin: CopilotPlugin, code: string) => {
		Logger.getInstance().log(`setDeviceCode ${code}`);

		const secureManager = SecureCredentialManager.getInstance();
		const currentCredentials = (await secureManager.getCredentials(
			plugin.app,
		)) || {
			deviceCode: null,
			pat: null,
			accessToken: { token: null, expiresAt: null },
		};

		const updatedCredentials = {
			...currentCredentials,
			deviceCode: code,
		};

		await secureManager.storeCredentials(updatedCredentials, plugin.app);
		set({ deviceCode: code });
	},

	setPAT: async (plugin: CopilotPlugin, pat: string) => {
		Logger.getInstance().log(`setPAT ${pat}`);

		const secureManager = SecureCredentialManager.getInstance();
		const currentCredentials = (await secureManager.getCredentials(
			plugin.app,
		)) || {
			deviceCode: null,
			pat: null,
			accessToken: { token: null, expiresAt: null },
		};

		const updatedCredentials = {
			...currentCredentials,
			pat: pat,
		};

		await secureManager.storeCredentials(updatedCredentials, plugin.app);
		set({ pat: pat });
	},

	setAccessToken: async (
		plugin: CopilotPlugin,
		token: CopilotChatSettings["accessToken"],
	) => {
		Logger.getInstance().log(`setAccessToken ${JSON.stringify(token)}`);

		const secureManager = SecureCredentialManager.getInstance();
		const currentCredentials = (await secureManager.getCredentials(
			plugin.app,
		)) || {
			deviceCode: null,
			pat: null,
			accessToken: { token: null, expiresAt: null },
		};

		const updatedCredentials = {
			...currentCredentials,
			accessToken: token,
		};

		await secureManager.storeCredentials(updatedCredentials, plugin.app);
		set({
			accessToken: token,
			isAuthenticated:
				!!token.token && !isTokenExpired(token.expiresAt || 0),
		});
	},

	fetchDeviceCode: async (plugin: CopilotPlugin) => {
		set({ isLoadingDeviceCode: true });

		try {
			const data = await fetchDeviceCode();
			Logger.getInstance().log(
				`Device code data ${JSON.stringify(data)}`,
			);

			await get().setDeviceCode(plugin, data.device_code);
			set({ deviceCodeData: data });

			return data;
		} catch (error) {
			Logger.getInstance().error(`Error fetching device code: ${error}`);
			new Notice("Failed to fetch device code. Please try again.");
			throw error;
		} finally {
			set({ isLoadingDeviceCode: false });
		}
	},

	fetchPAT: async (plugin: CopilotPlugin, deviceCode: string) => {
		set({ isLoadingPAT: true });

		try {
			const data = await fetchPAT(deviceCode);
			Logger.getInstance().log(`PAT data ${JSON.stringify(data)}`);

			await get().setPAT(plugin, data.access_token);

			if (data.access_token) {
				await get().fetchToken(plugin, data.access_token);
			}

			return data;
		} catch (error) {
			Logger.getInstance().error(`Error fetching PAT: ${error}`);
			new Notice("Failed to fetch PAT. Please try again.");
			throw error;
		} finally {
			set({ isLoadingPAT: false });
		}
	},

	fetchToken: async (plugin: CopilotPlugin, pat: string) => {
		set({ isLoadingToken: true });

		try {
			const data = await fetchToken(pat);
			Logger.getInstance().log(`Token data ${JSON.stringify(data)}`);

			await get().setAccessToken(plugin, {
				token: data.token,
				expiresAt: data.expires_at,
			});

			return data;
		} catch (error) {
			Logger.getInstance().error(`Error fetching token: ${error}`);
			new Notice("Failed to fetch token. Please try again.");
			await get().reset(plugin); // Reset on token fetch failure to restart auth flow
			throw error;
		} finally {
			set({ isLoadingToken: false });
		}
	},

	reset: async (plugin: CopilotPlugin) => {
		Logger.getInstance().log("reset");

		const secureManager = SecureCredentialManager.getInstance();
		await secureManager.deleteCredentials(plugin.app);

		set({
			deviceCode: null,
			pat: null,
			accessToken: {
				token: null,
				expiresAt: 0,
			},
			isAuthenticated: false,
			deviceCodeData: null,
		});

		// Also clear any remaining data from plugin settings
		if (!plugin.settings.chatSettings) {
			plugin.settings.chatSettings = { ...defaultChatSettings };
		} else {
			plugin.settings.chatSettings.deviceCode = null;
			plugin.settings.chatSettings.pat = null;
			plugin.settings.chatSettings.accessToken = {
				token: null,
				expiresAt: 0,
			};
		}
		await plugin.saveData(plugin.settings);
	},

	migrateCredentialsToSecureStorage: async (plugin: CopilotPlugin) => {
		const secureManager = SecureCredentialManager.getInstance();
		const chatSettings =
			plugin.settings.chatSettings || defaultChatSettings;

		const credentialsToMigrate = {
			deviceCode: chatSettings.deviceCode,
			pat: chatSettings.pat,
			accessToken: chatSettings.accessToken || {
				token: null,
				expiresAt: null,
			},
		};

		return await secureManager.migrateFromPlainText(credentialsToMigrate);
	},

	loadCredentialsFromSecureStorage: async (plugin: CopilotPlugin) => {
		const secureManager = SecureCredentialManager.getInstance();
		const credentials = await secureManager.getCredentials(plugin.app);

		if (credentials) {
			set({
				deviceCode: credentials.deviceCode,
				pat: credentials.pat,
				accessToken: credentials.accessToken || {
					token: null,
					expiresAt: 0,
				},
				isAuthenticated: !!(
					credentials.deviceCode &&
					credentials.pat &&
					credentials.accessToken?.token &&
					!isTokenExpired(credentials.accessToken?.expiresAt || 0)
				),
			});
		}
	},
});
