import { StateCreator } from "zustand";
import { Notice } from "obsidian";
import CopilotPlugin from "../../../main";
import { CopilotChatSettings } from "../../../settings/CopilotPluginSettingTab";
import {
	fetchDeviceCode,
	fetchPAT,
	fetchToken,
	DeviceCodeResponse,
	PATResponse,
	TokenResponse,
} from "../../api";

export interface AuthSlice {
	deviceCode: CopilotChatSettings["deviceCode"];
	pat: CopilotChatSettings["pat"];
	accessToken: CopilotChatSettings["accessToken"];
	isAuthenticated: boolean;
	isLoadingDeviceCode: boolean;
	isLoadingPAT: boolean;
	isLoadingToken: boolean;
	deviceCodeData: DeviceCodeResponse | null;

	init: (plugin: CopilotPlugin) => void;

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
}

const defaultChatSettings: CopilotChatSettings = {
	deviceCode: null,
	pat: null,
	accessToken: {
		token: null,
		expiresAt: 0,
	},
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

	init: (plugin: CopilotPlugin) => {
		const chatSettings =
			plugin.settings.chatSettings || defaultChatSettings;

		set({
			deviceCode: chatSettings.deviceCode,
			pat: chatSettings.pat,
			accessToken: chatSettings.accessToken || {
				token: null,
				expiresAt: 0,
			},
			isAuthenticated: !!(
				chatSettings.deviceCode &&
				chatSettings.pat &&
				chatSettings.accessToken?.token
			),
		});
	},

	setDeviceCode: async (plugin: CopilotPlugin, code: string) => {
		if (plugin) {
			console.log("setDeviceCode", code);

			if (!plugin.settings.chatSettings) {
				plugin.settings.chatSettings = { ...defaultChatSettings };
			}

			plugin.settings.chatSettings.deviceCode = code;
			await plugin.saveData(plugin.settings);
		}
		set({ deviceCode: code });
	},

	setPAT: async (plugin: CopilotPlugin, pat: string) => {
		if (plugin) {
			console.log("setPAT", pat);

			if (!plugin.settings.chatSettings) {
				plugin.settings.chatSettings = { ...defaultChatSettings };
			}

			plugin.settings.chatSettings.pat = pat;
			await plugin.saveData(plugin.settings);
		}
		set({ pat: pat });
	},

	setAccessToken: async (
		plugin: CopilotPlugin,
		token: CopilotChatSettings["accessToken"],
	) => {
		if (plugin) {
			console.log("setAccessToken", token);

			if (!plugin.settings.chatSettings) {
				plugin.settings.chatSettings = { ...defaultChatSettings };
			}

			plugin.settings.chatSettings.accessToken = token;
			await plugin.saveData(plugin.settings);
		}
		set({
			accessToken: token,
			isAuthenticated: !!token.token,
		});
	},

	fetchDeviceCode: async (plugin: CopilotPlugin) => {
		set({ isLoadingDeviceCode: true });

		try {
			const data = await fetchDeviceCode();
			console.log("Device code data", data);

			await get().setDeviceCode(plugin, data.device_code);
			set({ deviceCodeData: data });

			return data;
		} catch (error) {
			console.error("Error fetching device code:", error);
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
			console.log("PAT data", data);

			await get().setPAT(plugin, data.access_token);

			if (data.access_token) {
				await get().fetchToken(plugin, data.access_token);
			}

			return data;
		} catch (error) {
			console.error("Error fetching PAT:", error);
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
			console.log("Token data", data);

			await get().setAccessToken(plugin, {
				token: data.token,
				expiresAt: data.expires_at,
			});

			return data;
		} catch (error) {
			console.error("Error fetching token:", error);
			new Notice("Failed to fetch token. Please try again.");
			throw error;
		} finally {
			set({ isLoadingToken: false });
		}
	},

	reset: (plugin: CopilotPlugin) => {
		console.log("reset");
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

		// Ensure chatSettings exists before resetting
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
		plugin.saveData(plugin.settings);
	},
});
