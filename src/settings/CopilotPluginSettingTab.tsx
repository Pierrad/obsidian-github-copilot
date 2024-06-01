import { App, Notice, PluginSettingTab, Setting, debounce } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";

import CopilotPlugin from "../main";
import AuthModal from "../modal/AuthModal";
import KeybindingInput from "../components/KeybindingInput";
import Node from "../helpers/Node";
import Logger from "../helpers/Logger";

export interface SettingsObserver {
	onSettingsUpdate(): Promise<void>;
}

export type Hotkeys = {
	accept: string;
	cancel: string;
	request: string;
};

export interface CopilotPluginSettings {
	nodePath: string;
	enabled: boolean;
	hotkeys: Hotkeys;
	suggestionDelay: number;
	debug: boolean;
	onlyOnHotkey: boolean;
}

export const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: "default",
	enabled: true,
	hotkeys: {
		accept: "Tab",
		cancel: "Escape",
		request: "Cmd-Shift-/",
	},
	suggestionDelay: 500,
	debug: false,
	onlyOnHotkey: false,
};

class CopilotPluginSettingTab extends PluginSettingTab {
	plugin: CopilotPlugin;
	private observers: SettingsObserver[] = [];
	root: Root | null = null;

	constructor(app: App, plugin: CopilotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Node binary path")
			.setDesc(
				"The path to your node binary (at least Node v18). This is used to run the copilot server.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the path to your node binary.")
					.setValue(this.plugin.settings.nodePath)
					.onChange(async (value) => {
						this.plugin.settings.nodePath = value;
						await this.saveSettings();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText("Test the path")
					.setTooltip(
						"This will test the path and verify the version of node.",
					)
					.onClick(async () =>
						Node.testNodePath(this.plugin.settings.nodePath),
					),
			);

		new Setting(containerEl)
			.setName("Suggestions delay")
			.setDesc(
				"The delay in milliseconds before generating suggestions. Default is 500ms.",
			)
			.addText((text) => {
				text.inputEl.type = "number";
				return text
					.setPlaceholder("Enter the delay in milliseconds.")
					.setValue(this.plugin.settings.suggestionDelay.toString())
					.onChange(
						debounce(
							async (value) => {
								this.plugin.settings.suggestionDelay =
									parseInt(value);
								await this.saveSettings();
							},
							1000,
							true,
						),
					);
			});

		this.root = createRoot(
			containerEl.createEl("div", {
				cls: "copilot-settings-hotkeys-container",
			}),
		);

		const bindings = [
			{
				title: "Accept suggestion",
				description: "Keybinding to accept copilot suggestions.",
				value: this.plugin.settings.hotkeys.accept,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.accept = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.accept,
			},
			{
				title: "Cancel suggestion",
				description: "Keybinding to cancel copilot suggestions.",
				value: this.plugin.settings.hotkeys.cancel,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.cancel = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.cancel,
			},
			{
				title: "Request suggestion",
				description: "Keybinding to request copilot suggestions.",
				value: this.plugin.settings.hotkeys.request,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.request = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.request,
			},
		];

		this.root.render(
			<StrictMode>
				<h3>Keybindings</h3>
				<p className="copilot-settings-note">
					Be aware that not all keybindings will work as some are
					already defined and used by other plugins.
				</p>
				{bindings.map((binding, index) => (
					<KeybindingInput
						key={index}
						title={binding.title}
						description={binding.description}
						value={binding.value}
						onChange={binding.onChange}
						defaultValue={binding.defaultValue}
					/>
				))}
				<button
					className="mod-cta copilot-settings-save-button"
					onClick={() => {
						this.saveSettings().then(() => {
							this.plugin.app.workspace.updateOptions();
						});
					}}
				>
					Save keybindings
				</button>
			</StrictMode>,
		);

		new Setting(containerEl)
			.setName("Only on keybinding")
			.setDesc(
				"Only show suggestions when the 'request' keybinding is pressed. Default is false.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.onlyOnHotkey)
					.onChange(async (value) => {
						this.plugin.settings.onlyOnHotkey = value;
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Enable debug mode")
			.setDesc(
				"Enable logging for debugging purposes. Logs are written to the console.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debug)
					.onChange(async (value) => {
						this.plugin.settings.debug = value;
						Logger.getInstance().setDebug(value);
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.addButton((button) =>
				button
					.setButtonText("Restart sign-in process")
					.setTooltip(
						"Note that this will start the copilot service in the background.",
					)
					.onClick(async () => {
						this.needCopilotAgentEnabled(async () => {
							this.initSignIn();
						});
					}),
			)
			.addButton((button) =>
				button
					.setButtonText("Sign out")
					.setTooltip(
						"Note that this will start the copilot service in the background.",
					)
					.setWarning()
					.onClick(async () => {
						this.needCopilotAgentEnabled(async () => {
							this.signOut();
						});
					}),
			);
	}

	public hide(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}

	public async loadSettings() {
		this.plugin.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData(),
		);
	}

	public async saveSettings(
		notify = true,
		notice = true,
	): Promise<void | void[]> {
		await this.plugin.saveData(this.plugin.settings);
		if (notice) new Notice("Settings saved successfully.");
		if (notify) {
			return this.notifyObservers();
		}
		return Promise.resolve();
	}

	public isCopilotEnabled(): boolean {
		return this.plugin.settings.enabled;
	}

	private async needCopilotAgentEnabled(callback: () => void) {
		if (!this.plugin.settings.enabled) {
			this.plugin.settings.enabled = true;
			await this.saveSettings(true, false).then(() => {
				callback();
			});
		} else {
			callback();
		}
	}

	private async initSignIn() {
		await this.plugin.copilotAgent
			.getClient()
			.initiateSignIn()
			.then((res) => {
				if (res.status === "AlreadySignedIn") {
					new Notice("You are already signed in.");
				} else {
					new AuthModal(
						this.plugin,
						res.userCode,
						res.verificationUri,
					).open();
				}
			});
	}

	private async signOut() {
		await this.plugin.copilotAgent
			.getClient()
			.signOut()
			.then(() => {
				new Notice("Signed out successfully.");
			});
	}

	public registerObserver(observer: SettingsObserver) {
		this.observers.push(observer);
	}

	private notifyObservers(): Promise<void[]> {
		return Promise.all(
			this.observers.map((observer) => observer.onSettingsUpdate()),
		);
	}
}

export default CopilotPluginSettingTab;
