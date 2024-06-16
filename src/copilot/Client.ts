/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Cacher from "./Cacher";
import CopilotPlugin from "../main";
import Vault from "../helpers/Vault";
import Logger from "../helpers/Logger";

export type CopilotResponse = {
	jsonrpc: string;
	id: number;
	result: any;
};

class Client {
	private plugin: CopilotPlugin;
	private endpoint: JSONRPCEndpoint;
	private client: LspClient;
	private basePath: string;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
		this.basePath = Vault.getBasePath(this.plugin.app);
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
			rootUri: "file://" + this.basePath,
			initializationOptions: {},
		});
		await this.initialized();
		await this.checkStatus();
		await this.setEditorInfo();
	}

	private async initialize(
		params: InitializeParams,
	): Promise<InitializeResult> {
		return await this.client.initialize(params);
	}

	private async initialized(): Promise<void> {
		await this.client.initialized();
	}

	public async checkStatus(): Promise<void> {
		await this.client.customRequest("checkStatus", {
			localChecksOnly: false,
		});
	}

	public async setEditorInfo(): Promise<void> {
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
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile) {
			const content = await this.plugin.app.vault.read(activeFile);
			const didOpenParams = {
				textDocument: {
					uri: `file://${this.basePath}/${activeFile?.path}`,
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

	public async initiateSignIn(): Promise<any> {
		return await this.client.customRequest("signInInitiate", {});
	}

	public async confirmSignIn(code: string): Promise<any> {
		return await this.client.customRequest("signInConfirm", {
			userCode: code,
		});
	}

	public async signOut(): Promise<void> {
		return await this.client.customRequest("signOut", {});
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
			return this.client.customRequest("getCompletionsCycling", params);
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
