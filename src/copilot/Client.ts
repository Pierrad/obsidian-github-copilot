import { LspClient, JSONRPCEndpoint, InitializeParams, InitializeResult, DidOpenTextDocumentParams, DidChangeTextDocumentParams } from "@pierrad/ts-lsp-client"
import { App } from "obsidian";
import Cacher from "./Cacher";

class Client {
  private static instance: Client;
  private endpoint: JSONRPCEndpoint;
  private client: LspClient;

  private constructor() {}

  public static getInstance(): Client {
    if (!Client.instance) {
      Client.instance = new Client();
    }
    return Client.instance;
  }

  public configure(endpoint: JSONRPCEndpoint): void {
    this.endpoint = endpoint;
    this.client = new LspClient(this.endpoint);
  }

  public async initialize(params: InitializeParams): Promise<InitializeResult> {
    return await this.client.initialize(params);
  }

  public async checkStatus(): Promise<void> {
    const res = await this.client.customRequest('checkStatus', {
      localChecksOnly: false
    });

    console.log('checkStatus result : ', res);
  }

  public async setEditorInfo(app: App, basePath: string): Promise<void> {
    const res = await this.client.customRequest('setEditorInfo', {
      editorInfo: {
        name: 'obsidian',
        version: '0.0.1',
      },
      editorPluginInfo: {
          name: "obsidian-copilot",
          version: "0.0.1",
      },
    });

    console.log('setEditorInfo result : ', res);

    // Open the active file
    const activeFile = app.workspace.getActiveFile();
    if (activeFile) {
      const content = await app.vault.read(activeFile);
      const didOpenParams = {
        textDocument: {
          uri: `file://${basePath}/${activeFile?.path}`,
          languageId: 'markdown',
          version: Cacher.getInstance().getCache(activeFile?.path || ''),
          text: content
        }
      }

      await this.openDocument(didOpenParams);
    }
  }

  public async openDocument(params: DidOpenTextDocumentParams): Promise<void> {
    await this.client.didOpen(params);
  }

  public async didChange(params: DidChangeTextDocumentParams): Promise<void> {
    await this.client.didChange(params);
  }

  public async completion(params: any): Promise<any> {
    return this.client.customRequest('getCompletions', params);
  }
}

export default Client;