import { existsSync, lstatSync } from "fs";
import extract from "extract-zip";

class File {
	public static doesFolderExist(path: string): boolean {
		return existsSync(path) && lstatSync(path).isDirectory();
	}

	public static async unzipFolder(path: string): Promise<void> {
		try {
			await extract(path, { dir: path.replace(/\/[^/]+$/, "") });
		} catch (err) {
			console.error(err);
		}
	}
}

export default File;
