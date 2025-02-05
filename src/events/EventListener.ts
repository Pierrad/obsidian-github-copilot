import { Editor, MarkdownFileInfo, MarkdownView, TFile } from "obsidian";
import Cacher from "../copilot/Cacher";
import CopilotPlugin from "../main";
import Vault from "../helpers/Vault";
import Logger from "../helpers/Logger";
import LSP from "../helpers/LSP";

class EventListener {
	private plugin: CopilotPlugin;

	constructor(plugin: CopilotPlugin) {
		this.plugin = plugin;
	}

	public async onFileOpen(file: TFile | null): Promise<void> {
		try {
			const basePath = Vault.getBasePath(this.plugin.app);
			const content = await file?.vault.read(file);

			const didOpenParams = LSP.createDidOpenParams({
				uri: `${basePath}/${file?.path}`,
				version: Cacher.getInstance().getCache(file?.path || ""),
				text: content || "",
			});

			await this.plugin.copilotAgent
				.getClient()
				.openDocument(didOpenParams);
			Cacher.getInstance().setCurrentFilePath(basePath, file?.path || "");
		} catch (error) {
			Logger.getInstance().error(`Error onFileOpen: ${error}`);
		}
	}

	public async onEditorChange(
		editor: Editor,
		info: MarkdownView | MarkdownFileInfo,
	): Promise<void> {
		try {
			const basePath = Vault.getBasePath(this.plugin.app);
			const cursor = editor.getCursor();

			const file = info?.file;
			if (!file) {
				return;
			}

			const version = Cacher.getInstance().getCache(file.path);
			Cacher.getInstance().updateCache(file.path, version + 1);

			const didChangeParams = LSP.createDidChangeParams({
				uri: `${basePath}/${file.path}`,
				version: Cacher.getInstance().getCache(file.path),
				text: (info as MarkdownView).data,
			});

			await this.plugin.copilotAgent
				.getClient()
				.didChange(didChangeParams);

			// If onlyInCodeBlock is enabled, only trigger completions inside code blocks (between ``` and ```)
			if (this.plugin.settings.onlyInCodeBlock) {
				const cursor = editor.getCursor();
				let isInsideCodeBlock = false;
				for (let i = 0; i <= cursor.line; i++) {
					const line = editor.getLine(i);
					if (
						line.trim().includes("```") &&
						line.trim().length >= 3
					) {
						isInsideCodeBlock = !isInsideCodeBlock;
					}
				}
				if (!isInsideCodeBlock) {
					return;
				}
			}

			const completionParams = LSP.createCompletionParams({
				uri: `${basePath}/${file.path}`,
				relativePath: file.path,
				line: cursor.line,
				character: cursor.ch,
				version: Cacher.getInstance().getCache(file.path),
				indentSize: this.plugin.tabSize,
			});

			await this.plugin.copilotAgent.triggerCompletions(
				// @ts-ignore - cm is not typed
				editor.cm,
				completionParams,
			);
		} catch (error) {
			Logger.getInstance().error(`Error onEditorChange: ${error}`);
		}
	}
}

export default EventListener;
