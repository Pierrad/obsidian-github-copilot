import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as path from "path";
import { Notice } from "obsidian";
import { EditorView } from "@codemirror/view";

import CopilotPlugin from "../main";
import { SettingsObserver } from "../settings/CopilotPluginSettingTab";
import AuthModal from "../modal/AuthModal";
import Vault from "../helpers/Vault";
import Logger from "../helpers/Logger";
import Json from "../helpers/Json";
import Client, { CopilotResponse } from "./Client";
import File from "../helpers/File";
import { GetCompletionsParams } from "@pierrad/ts-lsp-client";
import { InlineSuggestionEffect } from "../extensions/InlineSuggestionState";

class CopilotAgent implements SettingsObserver {
	private plugin: CopilotPlugin;
	private client: Client;
	private agent: ChildProcessWithoutNullStreams;
	private agentPath: string;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.agentPath = path.join(
			Vault.getAgentInitializerPath(this.plugin.app, this.plugin.version),
		);
		this.plugin.settingsTab.registerObserver(this);
	}

	public getAgent(): ChildProcessWithoutNullStreams {
		return this.agent;
	}

	public getClient(): Client {
		if (!this.client) {
			new Notice("Copilot is not ready yet! Please check your settings.");
		}
		return this.client;
	}

	public async setup(): Promise<void> {
		this.startAgent();
		this.setupListeners();
		await this.configureClient();
		await this.trySignIn();
		new Notice("Copilot is ready!");
		return Promise.resolve();
	}

	public startAgent(): void {
		try {
			this.agent = spawn(
				File.wrapFilePath(this.plugin.settings.nodePath),
				[File.wrapFilePath(this.agentPath), "--stdio"],
				{
				shell: true,
				stdio: "pipe",
			},
			);
		} catch (error) {
			new Notice("Error starting agent: " + error);
		}
	}

	// Force sign in at startup for issue : https://github.com/Pierrad/obsidian-github-copilot/issues/36
	public async trySignIn(): Promise<void> {
		return await this.client.initiateSignIn().then((res) => {
			Logger.getInstance().log(
				"Try to sign in at copilot startup : " + JSON.stringify(res),
			);
			return res;
		});
	}

	public async configureClient() {
		this.client = new Client(this.plugin);
		await this.client.setup();
	}

	public stopAgent(): Promise<void> {
		if (this.agent) this.agent.kill();
		if (this.client) this.client.dispose();
		return Promise.resolve();
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
			} else if (data.toString().includes("DocumentVersionMismatch")) {
				Logger.getInstance().log("DocumentVersionMismatch");
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

	public async triggerCompletions(
		view: EditorView,
		params: GetCompletionsParams,
	): Promise<void> {
		this.plugin.statusBar?.updateElement(true);
		const res = await this.client.completion(params);
		this.plugin.statusBar?.updateElement();

		if (res && res.completions && res.completions.length > 0) {
			const completions = res.completions.map((c) => c.displayText);
			view.dispatch({
				effects: [
					InlineSuggestionEffect.of({
						suggestions: completions,
						index: 0,
					}),
				],
			});
		}
	}

	async onSettingsUpdate(): Promise<void> {
		if (await this.plugin.settingsTab.isCopilotEnabledWithPathCheck())
			return this.setup();
		return this.stopAgent();
	}
}

export default CopilotAgent;
