import { Notice } from "obsidian";
import { copilotDisabledIcon, copilotIcon } from "../assets/copilot";
import CopilotPlugin from "../main";

class StatusBar {
	private statusBarEl: HTMLElement;
	private plugin: CopilotPlugin;

	constructor(plugin: CopilotPlugin) {
		this.statusBarEl = plugin.addStatusBarItem();
		this.plugin = plugin;

		this.setupElement();
	}

	setupElement() {
		this.statusBarEl.createEl("div", {
			cls: "copilot-status-bar-item",
		});

		const container = document.querySelectorAll(
			".copilot-status-bar-item",
		)[0];

		container.innerHTML = this.plugin.settings.enabled
			? copilotIcon
			: copilotDisabledIcon;

		this.statusBarEl.classList.add("mod-clickable");
		this.statusBarEl.setAttribute(
			"aria-label",
			this.plugin.settings.enabled ? "Disable Copilot" : "Enable Copilot",
		);
		this.statusBarEl.setAttribute("data-tooltip-position", "top");
		this.statusBarEl.addEventListener("click", async (ev: MouseEvent) => {
			this.plugin.settings.enabled = !this.plugin.settings.enabled;
			container.innerHTML = this.plugin.settings.enabled
				? copilotIcon
				: copilotDisabledIcon;
			this.statusBarEl.setAttribute(
				"aria-label",
				this.plugin.settings.enabled
					? "Disable Copilot"
					: "Enable Copilot",
			);
			new Notice(
				this.plugin.settings.enabled
					? "Copilot is now enabled."
					: "Copilot is now disabled.",
			);
			await this.plugin.saveSettings();
		});
	}
}

export default StatusBar;
