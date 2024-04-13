import { Editor, MarkdownFileInfo, MarkdownView, TFile } from "obsidian";
import { EditorView } from "@codemirror/view";
import Client from "./copilot/Client";
import Cacher from "./copilot/Cacher";
import { InlineSuggestionEffect } from "./extensions/InlineSuggestionState";

class EventListener {
	public async onFileOpen(
		file: TFile | null,
		basePath: string,
		client: Client,
	): Promise<void> {
		const content = await file?.vault.read(file);

		const didOpenParams = {
			textDocument: {
				uri: `file://${basePath}/${file?.path}`,
				languageId: "markdown",
				version: Cacher.getInstance().getCache(file?.path || ""),
				text: content || "",
			},
		};

		console.log("didOpenParams", didOpenParams);

		await client.openDocument(didOpenParams);
	}

	public async onEditorChange(
		editor: Editor,
		info: MarkdownView | MarkdownFileInfo,
		basePath: string,
		client: Client,
	): Promise<void> {
		console.log("🚀 Editor change event", editor, info);
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		console.log(
			`Cursor at line ${cursor.line + 1}, column ${cursor.ch + 1}: ${line}`,
		);

		const file = info?.file;
		if (!file) {
			return;
		}

		const version = Cacher.getInstance().getCache(file.path);
		Cacher.getInstance().updateCache(file.path, version + 1);

		const content = await file.vault.read(file);
		const didChangeParams = {
			textDocument: {
				uri: `file://${basePath}/${file.path}`,
				version: Cacher.getInstance().getCache(file.path),
			},
			contentChanges: [
				{
					text: content,
				},
			],
		};

		console.log("didChangeParams", didChangeParams);

		await client.didChange(didChangeParams);

		const conpletionParams = {
			doc: {
				tabSize: 2,
				indentSize: 2,
				insertSpaces: true,
				uri: `file://${basePath}/${file.path}`,
				relativePath: "src/main.ts",
				position: {
					line: cursor.line,
					character: cursor.ch,
				},
				version: Cacher.getInstance().getCache(file.path),
			},
		};

		console.log("conpletionParams", conpletionParams);

		const res = await client.completion(conpletionParams);

		console.log("✅ completion result : ", res);

		if (res && res.completions && res.completions.length > 0) {
			const completion = res.completions[0].text;
			// editor.replaceRange(completion, cursor);
			// @ts-expect-error, not typed
			const editorView = editor.cm as EditorView;
			editorView.dispatch({
				effects: [
					InlineSuggestionEffect.of({
						suggestion: completion,
					}),
				],
			});
		}
	}
}

export default EventListener;
