import { Editor, MarkdownFileInfo, MarkdownView, TAbstractFile, TFile } from "obsidian";
import Client from "./copilot/Client";
import Cacher from "./copilot/Cacher";


class EventListener {
  public async onFileOpen(file: TFile | null, basePath: string, client: Client): Promise<void> {
    const content = await file?.vault.read(file);

    const didOpenParams = {
      textDocument: {
        uri: `file://${basePath}/${file?.path}`,
        languageId: 'markdown',
        version: Cacher.getInstance().getCache(file?.path || ''),
        text: content || ''
      }
    }

    console.log('didOpenParams', didOpenParams)
  
    await client.openDocument(didOpenParams);
  }

  public async onEditorChange(editor: Editor, info: MarkdownView | MarkdownFileInfo, basePath: string, client: Client): Promise<void> {
    console.log('🚀 Editor change event')
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    console.log(`Cursor at line ${cursor.line + 1}, column ${cursor.ch + 1}: ${line}`);

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
        version: Cacher.getInstance().getCache(file.path)
      },
      contentChanges: [{
        text: content
      }]
    }

    console.log('didChangeParams', didChangeParams)

    await client.didChange(didChangeParams);

    const conpletionParams = {
      doc: {
        indentSize: 2,
        insertSpaces: true,
        uri: `file://${basePath}/${file.path}`,
        relativePath: 'src/main.ts',
        position: {
          line: cursor.line,
          character: cursor.ch
        },
        version: Cacher.getInstance().getCache(file.path)
      }
    }

    console.log('conpletionParams', conpletionParams)

    const res = await client.completion(conpletionParams);

    console.log('✅ completion result : ', res)

    if (res && res.completions && res.completions.length > 0) {
      const completion = res.completions[0].text;
      editor.replaceRange(completion, cursor);
    }
  }

  public async onFileModify(file: TAbstractFile | null, basePath: string, client: Client): Promise<void> {
    // if (file instanceof TFile) {
    //   const version = Cacher.getInstance().getCache(file.path);
    //   Cacher.getInstance().updateCache(file.path, version + 1);

    //   const content = await file.vault.read(file);
    //   const didChangeParams = {
    //     textDocument: {
    //       uri: `file://${basePath}/${file?.path}`,
    //       version: version + 1
    //     },
    //     contentChanges: [{
    //       text: content
    //     }]
    //   }

    //   console.log('didChangeParams', didChangeParams)

    //   await client.didChange(didChangeParams);
    // }
  }
}

export default EventListener;
