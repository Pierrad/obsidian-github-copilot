import { copilotDisabledIcon, copilotIcon } from "../assets/copilot";
import CopilotPlugin from "../main";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";

class StatusBar implements SettingsObserver {
	private plugin: CopilotPlugin;
	private statusBarEl: HTMLElement;
	private container: Element;
	private copilotSvg: SVGSVGElement;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.statusBarEl = plugin.addStatusBarItem();
		this.plugin.settingsTab.registerObserver(this);

		this.setupElement();
	}

	setupElement() {
		this.container = this.statusBarEl.createEl("div", {
			cls: "copilot-status-bar-item",
		});

		this.updateElement();
		this.statusBarEl.classList.add("mod-clickable");
		this.statusBarEl.setAttribute("data-tooltip-position", "top");
		this.statusBarEl.addEventListener("click", async () => {
			this.plugin.settings.enabled =
				!this.plugin.settingsTab.isCopilotEnabled();
			this.updateElement();
			await this.plugin.settingsTab.saveSettings();
		});
	}

	updateElement() {
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
		this.copilotSvg = this.createSvgFromString(
			this.plugin.settingsTab.isCopilotEnabled()
				? copilotIcon
				: copilotDisabledIcon,
		);
		this.container.appendChild(this.copilotSvg);
		this.statusBarEl.setAttribute(
			"aria-label",
			this.plugin.settingsTab.isCopilotEnabled()
				? "Disable Copilot"
				: "Enable Copilot",
		);
	}

	createSvgFromString(svgString: string): SVGSVGElement {
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
		const svg = svgDoc.documentElement;
		return svg as unknown as SVGSVGElement;
	}

	onSettingsUpdate() {
		this.updateElement();
	}
}

export default StatusBar;
