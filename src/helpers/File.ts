import { Notice } from "obsidian";
import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";

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

	public static async removeOldCopilotFolders(
		currentVersion: string,
		path: string,
	) {
		const copilotFolders = readdirSync(path).filter((folder) =>
			folder.startsWith("copilot"),
		);

		copilotFolders.forEach((folder) => {
			const folderVersion = folder.split("-")[1];
			if (folderVersion !== currentVersion) {
				const folderPath = join(path, folder);
				rmSync(folderPath, { recursive: true, force: true });
			}
		});
	}

	public static wrapFilePath(path: string): string {
		return `"${path}"`;
	}
}

export default File;
