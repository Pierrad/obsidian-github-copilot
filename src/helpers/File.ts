import { Notice } from "obsidian";
import { existsSync, lstatSync, rename, unlink, readdirSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import extract from "extract-zip";

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

	public static async renameFolder(
		oldPath: string,
		newPath: string,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			rename(oldPath, newPath, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	public static async removeFile(path: string): Promise<void> {
		return new Promise((resolve, reject) => {
			unlink(path, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	public static async removeOldCopilotFolders(
		currentVersion: string,
		path: string,
	) {
		const copilotFolders = readdirSync(path).filter((folder) =>
			folder.startsWith("copilot-"),
		);

		copilotFolders.forEach((folder) => {
			const folderVersion = folder.split("-")[1];
			if (folderVersion !== currentVersion) {
				const folderPath = join(path, folder);
				rmSync(folderPath, { recursive: true, force: true });
			}
		});
	}

	public static async downloadCopilot(
		version: string,
		outputPath: string,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			new Notice(`Downloading Copilot version ${version}...`);
			const fileUrl = `https://cors-anywhere-liard.vercel.app/www.github.com/Pierrad/obsidian-github-copilot/releases/download/${version}/copilot.zip`;
			const outputPathFile = `${outputPath}/copilot-${version}.zip`;

			fetch(fileUrl)
				.then(async (response) => {
					const blob = await response.blob();
					const bos = Buffer.from(await blob.arrayBuffer());
					await writeFile(outputPathFile, bos)
						.then(() => {
							resolve();
						})
						.catch((err) => {
							new Notice("Error writing file: " + err);
							reject(err);
						});
				})
				.catch((err) => {
					reject(err);
					new Notice("Error downloading file: " + err);
				});
		});
	}
}

export default File;
