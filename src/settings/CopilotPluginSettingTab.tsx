import { App, Notice, PluginSettingTab, Setting, debounce } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";

import CopilotPlugin from "../main";
import AuthModal from "../modal/AuthModal";
import KeybindingInput from "../components/KeybindingInput";
import AutocompleteInput from "../components/AutocompleteInput";
import Node from "../helpers/Node";
import Logger from "../helpers/Logger";
import File from "../helpers/File";
import Json from "../helpers/Json";
import Vault from "../helpers/Vault";
import { defaultModels } from "../copilot-chat/store/slices/message";

export interface SettingsObserver {
	onSettingsUpdate(): Promise<void>;
}

export type Hotkeys = {
	accept: string;
	cancel: string;
	request: string;
	partial: string;
	next: string;
	disable: string;
};

export type CopilotChatSettings = {
	deviceCode: string | null;
	pat: string | null; // Personal Access Token to create the access token
	// Access token to authenticate the user
	accessToken: {
		token: string | null;
		expiresAt: number | null;
	};
	selectedModel?: {
		label: string;
		value: string;
	};
};

export interface CopilotPluginSettings {
	nodePath: string;
	nodePathUpdatedToNode20: boolean;
	enabled: boolean;
	hotkeys: Hotkeys;
	suggestionDelay: number;
	debug: boolean;
	onlyOnHotkey: boolean;
	onlyInCodeBlock: boolean;
	exclude: string[];
	deviceSpecificSettings: string[];
	useDeviceSpecificSettings: boolean;

	chatSettings?: CopilotChatSettings;
	systemPrompt: string;
	invertEnterSendBehavior: boolean;

}

export const DEFAULT_SETTINGS: CopilotPluginSettings = {
	nodePath: "default",
	nodePathUpdatedToNode20: false,
	enabled: true,
	hotkeys: {
		accept: "Tab",
		cancel: "Escape",
		request: "Cmd-Shift-/",
		partial: "Cmd-Shift-.",
		next: "Cmd-Shift-ArrowDown",
		disable: "Cmd-Shift-ArrowRight",
	},
	suggestionDelay: 500,
	debug: false,
	onlyOnHotkey: false,
	onlyInCodeBlock: false,
	exclude: [],
	deviceSpecificSettings: ["nodePath"],
	useDeviceSpecificSettings: false,

	chatSettings: {
		deviceCode: null,
		pat: null,
		accessToken: {
			token: null,
			expiresAt: null,
		},
		selectedModel: defaultModels[4],
	},
	systemPrompt:
		"You are GitHub Copilot, an AI assistant. You are helping the user with their tasks in Obsidian.",
	invertEnterSendBehavior: false,

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

		containerEl.createEl("h1", { text: "Inline Copilot Settings" });

		new Setting(containerEl)
			.setName("Enable Copilot")
			.setDesc(
				"Enable or disable the inline copilot. This will also start the copilot server.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Node binary path")
			.setDesc(
				"The path to your node binary (at least Node v20). This is used to run the copilot server.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the path to your node binary.")
					.setValue(this.plugin.settings.nodePath)
					.onChange(
						debounce(
							async (value) => {
								this.plugin.settings.nodePath = value;
								await this.saveSettings();
							},
							1000,
							true,
						),
					),
			)
			.addButton((button) =>
				button
					.setButtonText("Test the path")
					.setTooltip(
						"This will test the path and verify the version of node.",
					)
					.onClick(async () => {
						const path = await Node.testNodePath(
							this.plugin.settings.nodePath,
						);
						if (path) {
							this.plugin.settings.nodePath = path;
							await this.saveSettings();
						}
					}),
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
			{
				title: "Partial acceptation",
				description: "Keybinding to accept word per word suggestions.",
				value: this.plugin.settings.hotkeys.partial,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.partial = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.partial,
			},
			{
				title: "Next suggestion",
				description:
					"Keybinding to view the next suggestion if available.",
				value: this.plugin.settings.hotkeys.next,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.next = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.next,
			},
			{
				title: "Enable/Disable Copilot",
				description:
					"Keybinding to enable or disable copilot suggestions.",
				value: this.plugin.settings.hotkeys.disable,
				onChange: (value: string) => {
					this.plugin.settings.hotkeys.disable = value;
				},
				defaultValue: DEFAULT_SETTINGS.hotkeys.disable,
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
				<h3>Exclude folders and files</h3>
				<AutocompleteInput
					title="Exclude"
					description="Folders and files to exclude from suggestions."
					values={this.plugin.settings.exclude}
					plugin={this.plugin}
					onSave={(values: string[]) => {
						this.plugin.settings.exclude = values;
						this.saveSettings().then(() => {
							this.plugin.app.workspace.updateOptions();
						});
					}}
				/>
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
			.setName("Only in code block")
			.setDesc(
				"Only show suggestions when the cursor is inside a code block. Default is false.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.onlyInCodeBlock)
					.onChange(async (value) => {
						this.plugin.settings.onlyInCodeBlock = value;
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Use device-specific settings")
			.setDesc(
				"If enabled, certain settings (only the node path for now) will be saved to a separate file. This is useful when using the same vault on multiple devices. Default is false.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useDeviceSpecificSettings)
					.onChange(async (value) => {
						this.plugin.settings.useDeviceSpecificSettings = value;
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

		containerEl.createEl("h1", { text: "Copilot Chat Settings" });

		new Setting(containerEl)
			.setName("Invert Enter/Shift+Enter behavior")
			.setDesc(
				"When enabled, pressing Enter will create a new line and Shift+Enter will send the message. By default, Enter sends the message and Shift+Enter creates a new line.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.invertEnterSendBehavior)
					.onChange(async (value) => {
						this.plugin.settings.invertEnterSendBehavior = value;
						await this.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("System prompt")
			.setDesc(
				"Configure the system prompt used for new chat conversations.",
			)
			.addTextArea((text) => {
				text.inputEl.rows = 4;
				text.inputEl.cols = 50;
				return text
					.setPlaceholder("Enter a system prompt for Copilot Chat.")
					.setValue(this.plugin.settings.systemPrompt)
					.onChange(
						debounce(
							async (value) => {
								this.plugin.settings.systemPrompt = value;
								await this.saveSettings(false, true);
							},
							1000,
							true,
						),
					);
			});
	}

	public hide(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}

	public async loadSettings() {
		const defaultSettings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData(),
		);
		if (defaultSettings.useDeviceSpecificSettings) {
			this.plugin.settings = Object.assign(
				{},
				defaultSettings,
				Json.textToJsonObject(
					File.readFileSync(
						Vault.getPluginPath(this.plugin.app) +
							"/device_data.json",
					),
				) || {},
			);
		} else {
			this.plugin.settings = defaultSettings;
		}
	}

	public async saveSettings(
		notify = true,
		notice = true,
	): Promise<void | void[]> {
		if (this.plugin.settings.useDeviceSpecificSettings) {
			File.writeFileSync(
				Vault.getPluginPath(this.plugin.app) + "/device_data.json",
				Json.jsonObjectToText(
					Json.onlyKeepProperties(
						this.plugin.settings,
						this.plugin.settings.deviceSpecificSettings,
					),
				),
			);
		}
		await this.plugin.saveData(this.plugin.settings);
		await this.loadSettings();
		if (notice) new Notice("Settings saved successfully.");
		if (notify) return this.notifyObservers();
		return Promise.resolve();
	}

	public isCopilotEnabled(): boolean {
		return (
			this.plugin.settings.enabled &&
			this.plugin.settings.nodePath !== "" &&
			this.plugin.settings.nodePath !== DEFAULT_SETTINGS.nodePath
		);
	}

	public async isCopilotEnabledWithPathCheck(): Promise<boolean> {
		return (
			this.isCopilotEnabled() &&
			(await Node.testNodePath(this.plugin.settings.nodePath, true).then(
				async (path) => {
					if (!path) return false;
					if (path) {
						this.plugin.settings.nodePathUpdatedToNode20 = true;
						await this.saveSettings(false, false);
					}
					return true;
				},
			))
		);
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
