import {
	LspClient,
	JSONRPCEndpoint,
	InitializeParams,
	InitializeResult,
	DidOpenTextDocumentParams,
	DidChangeTextDocumentParams,
	GetCompletionsParams,
	CompletionList,
} from "@pierrad/ts-lsp-client";
import { App } from "obsidian";
import Cacher from "./Cacher";
import CopilotPlugin from "../main";
import Vault from "../helpers/Vault";

class Client {
	private plugin: CopilotPlugin;
	private vault: Vault;
	private endpoint: JSONRPCEndpoint;
	private client: LspClient;

	constructor(plugin: CopilotPlugin, vault: Vault) {
		this.plugin = plugin;
		this.vault = vault;
		this.endpoint = new JSONRPCEndpoint(
			this.plugin.copilotAgent.getAgent().stdin,
			this.plugin.copilotAgent.getAgent().stdout,
		);
		this.client = new LspClient(this.endpoint);
	}

	public async setup(): Promise<void> {
		const basePath = this.vault.getBasePath(this.plugin.app);
		await this.initialize({
			processId: this.plugin.copilotAgent.getAgent().pid as number,
			capabilities: {
				// @ts-expect-error - we're not using all the capabilities
				copilot: {
					openURL: true,
				},
			},
			clientInfo: {
				name: "ObsidianCopilot",
				version: "0.0.1",
			},
			rootUri: "file://" + basePath,
			initializationOptions: {},
		});

		await this.checkStatus();
		await this.setEditorInfo(this.plugin.app, basePath);
	}

	private async initialize(
		params: InitializeParams,
	): Promise<InitializeResult> {
		return await this.client.initialize(params);
	}

	private async checkStatus(): Promise<void> {
		const res = await this.client.customRequest("checkStatus", {
			localChecksOnly: false,
		});

		console.log("checkStatus result : ", res);
	}

	private async setEditorInfo(app: App, basePath: string): Promise<void> {
		const res = await this.client.customRequest("setEditorInfo", {
			editorInfo: {
				name: "obsidian",
				version: "0.0.1",
			},
			editorPluginInfo: {
				name: "obsidian-copilot",
				version: "0.0.1",
			},
		});

		console.log("setEditorInfo result : ", res);

		// Open the active file
		const activeFile = app.workspace.getActiveFile();
		if (activeFile) {
			const content = await app.vault.read(activeFile);
			const didOpenParams = {
				textDocument: {
					uri: `file://${basePath}/${activeFile?.path}`,
					languageId: "markdown",
					version: Cacher.getInstance().getCache(
						activeFile?.path || "",
					),
					text: content,
				},
			};

			await this.openDocument(didOpenParams);
		}
	}

	public async openDocument(
		params: DidOpenTextDocumentParams,
	): Promise<void> {
		await this.client.didOpen(params);
	}

	public async didChange(params: DidChangeTextDocumentParams): Promise<void> {
		await this.client.didChange(params);
	}

	public async completion(
		params: GetCompletionsParams,
	): Promise<CompletionList> {
		return this.client.customRequest("getCompletions", params);
	}

	public dispose(): void {
		this.client.exit();
	}
}

export default Client;
