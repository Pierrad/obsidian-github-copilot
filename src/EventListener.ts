import { Editor, MarkdownFileInfo, MarkdownView, Notice, TFile } from "obsidian";

interface IEventListener {
  onFileOpen(file: TFile): void;
  onEditorChange(editor: Editor, info: MarkdownView | MarkdownFileInfo): void;
}

class EventListener implements IEventListener {
  public onFileOpen(file: TFile): void {
    new Notice('File opened: ' + file?.path);
  }

  public onEditorChange(editor: Editor, info: MarkdownView | MarkdownFileInfo): void {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    new Notice(`Cursor at line ${cursor.line + 1}, column ${cursor.ch + 1}: ${line}`);
  }

}

export default EventListener;
