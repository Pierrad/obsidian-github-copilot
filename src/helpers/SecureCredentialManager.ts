import { Notice, App } from "obsidian";
import {
	randomBytes,
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	createHash,
} from "crypto";
import { platform, hostname, arch } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import Vault from "./Vault";
import Logger from "./Logger";

export interface SecureCredentials {
	deviceCode: string | null;
	pat: string | null;
	accessToken: {
		token: string | null;
		expiresAt: number | null;
	};
}

class SecureCredentialManager {
	private static instance: SecureCredentialManager;
	private encryptionKey: Buffer | null = null;
	private logger = Logger.getInstance();

	private constructor() {
		this.initializeEncryption();
	}

	public static getInstance(): SecureCredentialManager {
		if (!SecureCredentialManager.instance) {
			SecureCredentialManager.instance = new SecureCredentialManager();
		}
		return SecureCredentialManager.instance;
	}

	private async initializeEncryption(): Promise<void> {
		try {
			const deviceInfo = `${platform()}-${hostname()}-${arch()}`;
			const processInfo = `${process.platform}-${process.version}`;
			const combinedInfo = `${deviceInfo}|${processInfo}|obsidian-copilot-v1`;

			this.logger.log("[SecureCredentialManager] Key generation info:");
			this.logger.log(`  deviceInfo: ${deviceInfo}`);
			this.logger.log(`  processInfo: ${processInfo}`);
			this.logger.log(`  combinedInfo: ${combinedInfo}`);

			this.encryptionKey = pbkdf2Sync(
				combinedInfo,
				"obsidian-github-copilot-salt-v1",
				100000,
				32,
				"sha256",
			);

			this.logger.log(
				`[SecureCredentialManager] Generated key hash: ${this.encryptionKey?.toString("hex").substring(0, 16)}...`,
			);
			this.logger.log(
				"[SecureCredentialManager] Enhanced encryption initialized (AES-256 with PBKDF2)",
			);
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to initialize encryption: ${error}`,
			);
			throw new Error("Failed to initialize secure storage");
		}
	}

	public async storeCredentials(
		credentials: SecureCredentials,
		app?: App,
	): Promise<boolean> {
		try {
			const credentialString = JSON.stringify(credentials);
			const encrypted = this.encryptCredentials(credentialString);
			const pluginDataPath = this.getPluginDataPath(app);
			const success = await this.storeEncryptedCredentials(
				encrypted,
				pluginDataPath,
			);

			if (success) {
				this.logger.log(
					"[SecureCredentialManager] Credentials stored with AES-256 encryption",
				);
			}
			return success;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to store credentials: ${error}`,
			);
			new Notice(
				"Failed to securely store credentials. Please try again.",
			);
			return false;
		}
	}

	public async getCredentials(app?: App): Promise<SecureCredentials | null> {
		try {
			const pluginDataPath = this.getPluginDataPath(app);
			const encrypted =
				await this.getEncryptedCredentials(pluginDataPath);

			if (encrypted) {
				let decrypted = await this.attemptDecryption(
					encrypted,
					"current",
				);

				if (!decrypted) {
					this.logger.log(
						"[SecureCredentialManager] Current key failed, trying legacy keys...",
					);
					decrypted = await this.attemptDecryption(
						encrypted,
						"legacy",
					);
				}

				if (decrypted) {
					this.logger.log(
						"[SecureCredentialManager] Credentials retrieved from encrypted storage",
					);
					return JSON.parse(decrypted);
				} else {
					this.logger.error(
						"[SecureCredentialManager] All decryption attempts failed - clearing corrupted data",
					);
					await this.deleteEncryptedCredentials(pluginDataPath);
					return null;
				}
			}
			return null;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to retrieve credentials: ${error}`,
			);
			return null;
		}
	}

	public async deleteCredentials(app?: App): Promise<boolean> {
		try {
			const pluginDataPath = this.getPluginDataPath(app);
			await this.deleteEncryptedCredentials(pluginDataPath);
			this.logger.log(
				"[SecureCredentialManager] Credentials deleted from encrypted storage",
			);
			return true;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to delete credentials: ${error}`,
			);
			return false;
		}
	}

	public async migrateFromPlainText(
		plainCredentials: SecureCredentials,
	): Promise<boolean> {
		this.logger.log(
			"[SecureCredentialManager] Starting migration from plain text to secure storage",
		);

		if (
			!plainCredentials.deviceCode &&
			!plainCredentials.pat &&
			!plainCredentials.accessToken?.token
		) {
			this.logger.log(
				"[SecureCredentialManager] No credentials to migrate",
			);
			return true;
		}

		const success = await this.storeCredentials(plainCredentials);
		if (success) {
			this.logger.log(
				"[SecureCredentialManager] Successfully migrated credentials to secure storage",
			);
			new Notice(
				"GitHub Copilot credentials have been migrated to secure storage.",
			);
		} else {
			this.logger.error(
				"[SecureCredentialManager] Failed to migrate credentials",
			);
			new Notice(
				"Failed to migrate credentials to secure storage. Please re-authenticate.",
			);
		}

		return success;
	}

	public async hasCredentials(app?: App): Promise<boolean> {
		const credentials = await this.getCredentials(app);
		return !!(
			credentials &&
			(credentials.deviceCode ||
				credentials.pat ||
				credentials.accessToken?.token)
		);
	}

	private encryptCredentials(data: string): string {
		if (!this.encryptionKey) {
			throw new Error("Encryption key not initialized");
		}

		const iv = randomBytes(16); // 16 bytes IV for AES
		const cipher = createCipheriv("aes-256-cbc", this.encryptionKey, iv);

		let encrypted = cipher.update(data, "utf8", "hex");
		encrypted += cipher.final("hex");

		const result = iv.toString("hex") + ":" + encrypted;

		this.logger.log("[SecureCredentialManager] ENCRYPTION DEBUG:");
		this.logger.log(`  Data length: ${data.length}`);
		this.logger.log(`  IV hex: ${iv.toString("hex")}`);
		this.logger.log(`  Encrypted hex length: ${encrypted.length}`);
		this.logger.log(`  Final result length: ${result.length}`);
		this.logger.log(
			`  Final result format check - has colon: ${result.includes(":")}`,
		);
		this.logger.log(`  Parts after split: ${result.split(":").length}`);

		return result;
	}

	private async attemptDecryption(
		encryptedData: string,
		keyType: "current" | "legacy",
	): Promise<string | null> {
		this.logger.log(
			`[SecureCredentialManager] Attempting decryption with ${keyType} key`,
		);

		const parts = encryptedData.split(":");
		if (parts.length !== 2) {
			this.logger.error("Invalid encrypted data format");
			return null;
		}

		try {
			const iv = Buffer.from(parts[0], "hex");
			const encrypted = parts[1];

			let key: Buffer;
			if (keyType === "current") {
				key = this.encryptionKey!;
			} else {
				key = this.generateLegacyKey();
			}

			this.logger.log(
				`  Using key hash: ${key.toString("hex").substring(0, 16)}...`,
			);

			const decipher = createDecipheriv("aes-256-cbc", key, iv);
			let decrypted = decipher.update(encrypted, "hex", "utf8");
			decrypted += decipher.final("utf8");

			this.logger.log(`  ${keyType} key decryption successful!`);
			return decrypted;
		} catch (error) {
			this.logger.log(`  ${keyType} key failed: ${error.message}`);
			return null;
		}
	}

	private generateLegacyKey(): Buffer {
		const deviceInfo = `${platform()}-${hostname()}-${arch()}`;
		const processInfo = `${process.platform}-${process.version}`;
		const combinedInfo = `${deviceInfo}|${processInfo}|obsidian-copilot-v1`;

		this.logger.log(`  Legacy key combinedInfo: ${combinedInfo}`);

		const hash = createHash("sha256");
		hash.update(combinedInfo);
		const legacyKey = hash.digest().slice(0, 32);
		this.logger.log(
			`  Legacy key hash: ${legacyKey.toString("hex").substring(0, 16)}...`,
		);
		return legacyKey;
	}

	private async storeEncryptedCredentials(
		encrypted: string,
		pluginDataPath?: string,
	): Promise<boolean> {
		try {
			if (pluginDataPath) {
				const secureFilePath = join(
					pluginDataPath,
					"secure-credentials.dat",
				);
				writeFileSync(secureFilePath, encrypted, "utf8");
				return true;
			}

			if (typeof localStorage !== "undefined") {
				localStorage.setItem(
					"obsidian-copilot-secure-creds",
					encrypted,
				);
				return true;
			}
			return false;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to store encrypted credentials: ${error}`,
			);
			return false;
		}
	}

	private async getEncryptedCredentials(
		pluginDataPath?: string,
	): Promise<string | null> {
		try {
			if (pluginDataPath) {
				const secureFilePath = join(
					pluginDataPath,
					"secure-credentials.dat",
				);
				this.logger.log(
					`[SecureCredentialManager] Attempting to read from: ${secureFilePath}`,
				);
				this.logger.log(`  File exists: ${existsSync(secureFilePath)}`);

				if (existsSync(secureFilePath)) {
					const data = readFileSync(secureFilePath, "utf8");
					this.logger.log(`  File data length: ${data?.length || 0}`);
					this.logger.log(
						`  File data preview: ${data?.substring(0, 100)}...`,
					);
					return data || null;
				}
			}

			if (typeof localStorage !== "undefined") {
				const data = localStorage.getItem(
					"obsidian-copilot-secure-creds",
				);
				this.logger.log(
					`[SecureCredentialManager] localStorage data length: ${data?.length || 0}`,
				);
				return data;
			}
			return null;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to get encrypted credentials: ${error}`,
			);
			return null;
		}
	}

	private async deleteEncryptedCredentials(
		pluginDataPath?: string,
	): Promise<void> {
		try {
			if (pluginDataPath) {
				const secureFilePath = join(
					pluginDataPath,
					"secure-credentials.dat",
				);
				if (existsSync(secureFilePath)) {
					unlinkSync(secureFilePath);
				}
			}

			if (typeof localStorage !== "undefined") {
				localStorage.removeItem("obsidian-copilot-secure-creds");
			}
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to delete encrypted credentials: ${error}`,
			);
		}
	}

	private getPluginDataPath(app?: App): string | undefined {
		try {
			if (app) {
				return Vault.getPluginPath(app);
			}
			this.logger.error(
				"[SecureCredentialManager] No App object provided, cannot determine plugin path",
			);
			return undefined;
		} catch (error) {
			this.logger.error(
				`[SecureCredentialManager] Failed to get plugin data path: ${error}`,
			);
			return undefined;
		}
	}

	public getStorageInfo(): { method: string; secure: boolean } {
		return {
			method: "AES-256 + PBKDF2 encryption",
			secure: true,
		};
	}
}

export default SecureCredentialManager;
