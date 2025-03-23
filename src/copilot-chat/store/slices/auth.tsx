import { StateCreator } from 'zustand'
import CopilotPlugin from "../../../main";
import { CopilotChatSettings } from '../../../settings/CopilotPluginSettingTab';

export interface AuthSlice {
  deviceCode: CopilotChatSettings['deviceCode'];
  pat: CopilotChatSettings['pat'];
  accessToken: CopilotChatSettings['accessToken'];
  isAuthenticated: boolean;
  init: (plugin: CopilotPlugin) => void;
  setDeviceCode: (plugin: CopilotPlugin, code: string) => void;
  setPAT: (plugin: CopilotPlugin, pat: string) => void;
  setAccessToken: (plugin: CopilotPlugin, token: CopilotChatSettings['accessToken']) => void;
  reset: (plugin: CopilotPlugin) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  deviceCode: null,
  pat: null,
  accessToken: {
    token: null,
    expiresAt: 0,
  },
  isAuthenticated: false,
  init: (plugin: CopilotPlugin) => {
    const { chatSettings } = plugin.settings;
    if (!chatSettings) return;
    set({
      deviceCode: chatSettings.deviceCode,
      pat: chatSettings.pat,
      accessToken: chatSettings.accessToken,
      isAuthenticated: !!(
        chatSettings.deviceCode &&
        chatSettings.pat &&
        chatSettings.accessToken?.token
      ),
    });
  },
  setDeviceCode: (plugin: CopilotPlugin, code: string) => {
    if (plugin) {
      console.log("setDeviceCode", code);
      plugin.saveData({
        ...plugin.settings,
        chatSettings: {
          ...plugin.settings.chatSettings,
          deviceCode: code,
        },
      });
    }
    set({ deviceCode: code });
  },
  setPAT: (plugin: CopilotPlugin, pat: string) => {
    if (plugin) {
      console.log("setPAT", pat);
      plugin.saveData({
        ...plugin.settings,
        chatSettings: {
          ...plugin.settings.chatSettings,
          pat: pat,
        },
      });
    }
    set({ pat: pat });
  },
  setAccessToken: (plugin: CopilotPlugin, token: {
    token: string;
    expiresAt: number;
  }) => {
    if (plugin) {
      console.log("setAccessToken", token);
      plugin.saveData({
        ...plugin.settings,
        chatSettings: {
          ...plugin.settings.chatSettings,
          accessToken: token,
        },
      });
    }
    set({ accessToken: token });
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
    });
    plugin.saveData({
      ...plugin.settings,
      chatSettings: {
        ...plugin.settings.chatSettings,
        deviceCode: null,
        pat: null,
        accessToken: {
          token: null,
          expiresAt: 0,
        },
      },
    });
  },
})
