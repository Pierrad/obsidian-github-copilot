import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as path from "path";
import { Notice } from "obsidian";
import CopilotPlugin from "../main";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";
import AuthModal from "../modal/AuthModal";
import Vault from "../helpers/Vault";
import Logger from "../helpers/Logger";
import Json from "../helpers/Json";
import Client, { CopilotResponse } from "./Client";

class CopilotAgent implements SettingsObserver {
	private plugin: CopilotPlugin;
	private client: Client;
	private agent: ChildProcessWithoutNullStreams;
	private agentPath: string;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.agentPath = path.join(
			Vault.getAgentPath(this.plugin.app, this.plugin.version),
		);
		this.plugin.settingsTab.registerObserver(this);
	}

	public async setup(): Promise<void> {
		this.startAgent();
		this.setupListeners();
		await this.configureClient();
		new Notice("Copilot is ready!");
	}

	public startAgent(): void {
		try {
			this.agent = spawn(
				this.plugin.settings.nodePath,
				[`"${this.agentPath}"`, "--stdio"],
				{
					shell: true,
					stdio: "pipe",
				},
			);
		} catch (error) {
			new Notice("Error starting agent: " + error);
		}
	}

	public async configureClient() {
		this.client = new Client(this.plugin);
		await this.client.setup();
	}

	public stopAgent(): void {
		if (this.agent) this.agent.kill();
		if (this.client) this.client.dispose();
	}

	public setupListeners(): void {
		this.agent.stdout.on("data", (data) => {
			Logger.getInstance().log(`stdout: ${data}`);
			if (data.toString().includes("NotSignedIn")) {
				const json = Json.extractJsonObject(
					data.toString(),
				) as CopilotResponse;
				if (json?.result?.status === "NotSignedIn") {
					this.client.initiateSignIn().then((res) => {
						new AuthModal(
							this.plugin,
							res.userCode,
							res.verificationUri,
						).open();
					});
				}
			}
		});

		this.agent.stderr.on("data", (data) => {
			Logger.getInstance().error(`stderr: ${data}`);
		});

		this.agent.on("exit", (code) => {
			Logger.getInstance().log(`child process exited with code ${code}`);
			new Notice("Copilot has stopped.");
		});
	}

	public getAgent(): ChildProcessWithoutNullStreams {
		return this.agent;
	}

	public getClient(): Client {
		return this.client;
	}

	onSettingsUpdate(): void {
		if (this.plugin.settingsTab.isCopilotEnabled()) this.setup();
		else this.stopAgent();
	}
}

export default CopilotAgent;
