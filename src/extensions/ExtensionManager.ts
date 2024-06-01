/* eslint-disable @typescript-eslint/no-explicit-any */

import { SettingsObserver } from "../settings/CopilotPluginSettingTab";

import { inlineSuggestionPlugin } from "./InlineSuggestionPlugin";
import { inlineSuggestionField } from "./InlineSuggestionState";
import { inlineSuggestionKeyWatcher } from "./InlineSuggestionKeyWatcher";
import CopilotPlugin from "../main";

class ExtensionManager implements SettingsObserver {
	private plugin: CopilotPlugin;
	private extensions: any[] = [];

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.initExtensions();
		this.plugin.settingsTab.registerObserver(this);
	}

	public initExtensions(): void {
		this.extensions = [
			inlineSuggestionKeyWatcher(
				this.plugin.settings.hotkeys,
				this.plugin.copilotAgent,
			),
			inlineSuggestionField,
			inlineSuggestionPlugin,
		];
	}

	public getExtensions(): any[] {
		return this.extensions;
	}

	onSettingsUpdate(): Promise<void> {
		this.extensions.shift();
		this.extensions.unshift(
			inlineSuggestionKeyWatcher(
				this.plugin.settings.hotkeys,
				this.plugin.copilotAgent,
			),
		);
		return Promise.resolve();
	}
}

export default ExtensionManager;
