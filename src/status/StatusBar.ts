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

		this.updateElement();
		this.statusBarEl.classList.add("mod-clickable");
		this.statusBarEl.setAttribute("data-tooltip-position", "top");
		this.statusBarEl.addEventListener("click", async (ev: MouseEvent) => {
			this.plugin.settings.enabled =
				!this.plugin.settingsTab.isCopilotEnabled();
			this.updateElement();
			await this.plugin.settingsTab.saveSettings();
		});
	}

	updateElement() {
		this.container.innerHTML = this.plugin.settingsTab.isCopilotEnabled()
			? copilotIcon
			: copilotDisabledIcon;
		this.statusBarEl.setAttribute(
			"aria-label",
			this.plugin.settingsTab.isCopilotEnabled()
				? "Disable Copilot"
				: "Enable Copilot",
		);
	}

	updateSettings() {
		this.updateElement();
	}
}

export default StatusBar;
