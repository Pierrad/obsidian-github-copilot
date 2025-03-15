import * as child_process from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
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

		// Standardize path based on OS
		if (os.platform() === "win32") {
			// Ensure consistent use of backslashes on Windows
			nodePath = nodePath.replace(/\//g, "\\");
			
			// If no extension specified and it's not a directory, try to add .exe
			if (!nodePath.endsWith(".exe") && !fs.existsSync(nodePath) && !fs.existsSync(nodePath + "\\")) {
				const pathWithExe = nodePath + ".exe";
				if (fs.existsSync(pathWithExe)) {
					nodePath = pathWithExe;
				}
			}
		} else {
			// Ensure consistent use of forward slashes on non-Windows
			nodePath = nodePath.replace(/\\/g, "/");
		}

		return path.resolve(nodePath);
	}

	public static normalizePath(nodePath: string): string {
		return path.normalize(this.expandPath(nodePath));
	}

	public static async testNodePath(nodePath: string): Promise<string | void> {
		try {
			const normalizedPath = this.normalizePath(nodePath);
			
			if (!fs.existsSync(normalizedPath)) {
				new Notice(
					`Node.js executable not found at: ${normalizedPath}. Please check the path.`,
				);
				return;
			}

			const result = await new Promise<string>((resolve, reject) => {
				let spawnOptions = {};
				
				if (os.platform() === "win32") {
					spawnOptions = { shell: true };
				}

				const nodeProcess = child_process.spawn(
					normalizedPath,
					["--version"],
					spawnOptions
				);
				
				let output = "";
				let errorOutput = "";

				nodeProcess.stdout.on("data", (data) => {
					output += data.toString();
				});

				nodeProcess.stderr.on("data", (data) => {
					errorOutput += data.toString();
				});

				nodeProcess.on("close", (code) => {
					if (code === 0) {
						resolve(output.trim());
					} else {
						reject(
							new Error(`Node process exited with code ${code}${errorOutput ? ': ' + errorOutput.trim() : ''}`)
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

				if (nodePath !== normalizedPath) {
					new Notice(
						`Node.js path has been normalized to: ${normalizedPath}. It will be used from now on. You might need to reload the plugin view to see the changes.`,
					);
				}

				return normalizedPath;
			} else {
				new Notice(
					`Node.js path is valid, but the version ${nodeVersion} is not compatible. Please use Node.js v${requiredVersion} or later.`,
				);
				return;
			}
		} catch (err) {
			new Notice(`Error while testing the Node.js path: ${err.message}`);
			return;
		}
	}
}

export default Node;
