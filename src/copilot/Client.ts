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
import Logger from "../helpers/Logger";

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
		this.setupListeners();
		this.client = new LspClient(this.endpoint);
	}

	public setupListeners(): void {
		this.endpoint.on("error", (error) => {
			Logger.getInstance().error("Error in JSONRPC endpoint: " + error);
		});
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
		await this.initialized();
		await this.checkStatus();
		await this.setEditorInfo(this.plugin.app, basePath);
	}

	private async initialize(
		params: InitializeParams,
	): Promise<InitializeResult> {
		return await this.client.initialize(params);
	}

	private async initialized(): Promise<void> {
		await this.client.initialized();
	}

	private async checkStatus(): Promise<void> {
		await this.client.customRequest("checkStatus", {
			localChecksOnly: false,
		});
	}

	private async setEditorInfo(app: App, basePath: string): Promise<void> {
		await this.client.customRequest("setEditorInfo", {
			editorInfo: {
				name: "obsidian",
				version: "0.0.1",
			},
			editorPluginInfo: {
				name: "obsidian-copilot",
				version: "0.0.1",
			},
		});

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
		try {
			await this.client.didOpen(params);
		} catch (error) {
			Logger.getInstance().error("Error in openDocument: " + error);
		}
	}

	public async didChange(params: DidChangeTextDocumentParams): Promise<void> {
		try {
			await this.client.didChange(params);
		} catch (error) {
			Logger.getInstance().error("Error in didChange: " + error);
		}
	}

	public async completion(
		params: GetCompletionsParams,
	): Promise<CompletionList> {
		try {
			return this.client.customRequest("getCompletions", params);
		} catch (error) {
			Logger.getInstance().error("Error in completion: " + error);
			return {
				completions: [],
			};
		}
	}

	public dispose(): void {
		this.client.exit();
	}
}

export default Client;
