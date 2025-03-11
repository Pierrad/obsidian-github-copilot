import * as child_process from "child_process";
import * as path from "path";
import * as os from "os";
import { Notice } from "obsidian";

class Node {
	public static expandPath(nodePath: string): string {
		if (!nodePath) {
			return nodePath;
		}

		if (nodePath.startsWith("~")) {
			nodePath = nodePath.replace(/^~(?=$|\/|\\)/, os.homedir());
		}

		// Expand Unix-style environment variables ($VAR)
		nodePath = nodePath.replace(
			/\$([A-Za-z_][A-Za-z0-9_]*)/g,
			(_, varName) => {
				return process.env[varName] || "";
			},
		);

		// Expand Windows-style environment variables (%VAR%)
		nodePath = nodePath.replace(
			/%([A-Za-z_][A-Za-z0-9_]*)%/g,
			(_, varName) => {
				return process.env[varName] || "";
			},
		);

		return path.resolve(nodePath);
	}

	public static async testNodePath(nodePath: string): Promise<void> {
		try {
			const result = await new Promise<string>((resolve, reject) => {
				const nodeProcess = child_process.spawn(
					Node.expandPath(nodePath),
					["--version"],
				);
				let output = "";

				nodeProcess.stdout.on("data", (data) => {
					output += data.toString();
				});

				nodeProcess.on("close", (code) => {
					if (code === 0) {
						resolve(output.trim());
					} else {
						reject(
							new Error(`Node process exited with code ${code}`),
						);
					}
				});

				nodeProcess.on("error", (err) => {
					reject(err);
				});
			});

			const nodeVersion = result.slice(1);
			const requiredVersion = 18;

			if (parseFloat(nodeVersion) >= requiredVersion) {
				new Notice(
					`Node.js path is valid and the version ${nodeVersion} is compatible.`,
				);
			} else {
				new Notice(
					`Node.js path is valid, but the version ${nodeVersion} is not compatible. Please use Node.js v${requiredVersion} or later.`,
				);
			}
		} catch (err) {
			new Notice(`Error while testing the Node.js path: ${err.message}`);
		}
	}
}

export default Node;
