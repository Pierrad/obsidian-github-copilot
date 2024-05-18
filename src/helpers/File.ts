import { Notice } from "obsidian";
import { existsSync, lstatSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";

class File {
	public static doesFolderExist(path: string): boolean {
		return existsSync(path) && lstatSync(path).isDirectory();
	}

	public static createFolder(path: string): void {
		if (!this.doesFolderExist(path)) {
			mkdirSync(path, { recursive: true });
		}
	}

	public static createFile(path: string, content: string): Promise<void> {
		return new Promise((resolve, reject) => {
			writeFile(path, content)
				.then(() => {
					resolve();
				})
				.catch((err) => {
					new Notice("Error writing file: " + err);
					reject(err);
				});
		});
	}
}

export default File;
