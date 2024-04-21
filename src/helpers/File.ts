import { existsSync, lstatSync } from "fs";
import extract from "extract-zip";
import { Notice } from "obsidian";

class File {
	public static doesFolderExist(path: string): boolean {
		return existsSync(path) && lstatSync(path).isDirectory();
	}

	public static async unzipFolder(path: string): Promise<void> {
		try {
			await extract(path, { dir: path.replace(/\/[^/]+$/, "") });
		} catch (err) {
			new Notice("Error unzipping folder: " + err);
		}
	}
}

export default File;
