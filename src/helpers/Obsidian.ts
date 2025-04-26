import { Notice } from "obsidian";

class Obsidian {
	public static Notice(message: string, isSilent = false): void {
		if (isSilent) {
			return;
		}
		new Notice(message);
	}
}

export default Obsidian;
