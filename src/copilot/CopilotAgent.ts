import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import Vault from "../helpers/Vault";
import CopilotPlugin from "../main";
import * as path from "path";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";
import Client from "./Client";
import { Notice } from "obsidian";

class CopilotAgent implements SettingsObserver {
	private plugin: CopilotPlugin;
	private client: Client;
	private agent: ChildProcessWithoutNullStreams;
	private nodePath: string;
	private vault: Vault;
	private agentPath: string;
	private enableLogging: boolean;

	constructor(plugin: CopilotPlugin, vault: Vault, enableLogging: boolean) {
		this.plugin = plugin;
		this.vault = vault;
		this.enableLogging = enableLogging;
		this.nodePath = this.plugin.settings.nodePath;
		this.agentPath = path.join(
			this.vault.getBasePath(this.plugin.app),
			"/.obsidian/plugins/github-copilot/copilot/agent.js",
		);
		this.plugin.settingsTab.registerObserver(this);
	}

	public async setup(): Promise<void> {
		this.startAgent();
		if (this.enableLogging) {
			this.logger();
		}
		await this.configureClient();
		new Notice("Copilot is ready!");
	}

	public startAgent(): void {
		try {
			this.agent = spawn(this.nodePath, [this.agentPath, "--stdio"], {
				shell: true,
				stdio: "pipe",
			});
		} catch (error) {
			console.error("Error starting agent", error);
		}
	}

	public async configureClient() {
		this.client = new Client(this.plugin, this.vault);
		await this.client.setup();
	}

	public stopAgent(): void {
		this.agent.kill();
		this.client.dispose();
	}

	public logger(): void {
		this.agent.stdout.on("data", (data) => {
			console.log(`stdout: ${data}`);
		});

		this.agent.stderr.on("data", (data) => {
			console.log(`stderr: ${data}`);
		});

		this.agent.on("exit", (code) => {
			console.log(`child process exited with code ${code}`);
		});
	}

	public getAgent(): ChildProcessWithoutNullStreams {
		return this.agent;
	}

	public getClient(): Client {
		return this.client;
	}

	updateSettings(): void {
		if (this.plugin.settingsTab.isCopilotEnabled()) this.setup();
		else this.stopAgent();
	}
}

export default CopilotAgent;
