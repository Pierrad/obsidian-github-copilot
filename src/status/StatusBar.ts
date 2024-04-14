import { Notice } from "obsidian";
import { copilotDisabledIcon, copilotIcon } from "../assets/copilot";
import CopilotPlugin from "../main";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";

class StatusBar implements SettingsObserver {
	private plugin: CopilotPlugin;
	private statusBarEl: HTMLElement;
	private container: Element;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.statusBarEl = plugin.addStatusBarItem();
		this.plugin.settingsTab.registerObserver(this);

		this.setupElement();
	}

	setupElement() {
		this.statusBarEl.createEl("div", {
			cls: "copilot-status-bar-item",
		});

		this.container = document.querySelectorAll(
			".copilot-status-bar-item",
		)[0];

		this.updateContainerContent();

		this.statusBarEl.classList.add("mod-clickable");
		this.statusBarEl.setAttribute(
			"aria-label",
			this.isCopilotEnabled() ? "Disable Copilot" : "Enable Copilot",
		);
		this.statusBarEl.setAttribute("data-tooltip-position", "top");
		this.statusBarEl.addEventListener("click", async (ev: MouseEvent) => {
			this.plugin.settings.enabled = !this.isCopilotEnabled();
			this.updateContainerContent();
			this.statusBarEl.setAttribute(
				"aria-label",
				this.isCopilotEnabled() ? "Disable Copilot" : "Enable Copilot",
			);
			new Notice(
				this.isCopilotEnabled()
					? "Copilot is now enabled."
					: "Copilot is now disabled.",
			);
			await this.plugin.settingsTab.saveSettings();
		});
	}

	updateContainerContent() {
		this.container.innerHTML = this.isCopilotEnabled()
			? copilotIcon
			: copilotDisabledIcon;
	}

	isCopilotEnabled(): boolean {
		return this.plugin.settings.enabled;
	}

	updateSettings() {
		this.updateContainerContent();
	}
}

export default StatusBar;
