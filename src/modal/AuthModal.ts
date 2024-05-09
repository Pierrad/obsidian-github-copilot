import { Modal, Notice, Setting } from "obsidian";
import CopilotPlugin from "../main";

class AuthModal extends Modal {
	private plugin: CopilotPlugin;
	private userCode: string;
	private verificationUrl: string;

	constructor(
		plugin: CopilotPlugin,
		userCode: string,
		verificationUrl: string,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.userCode = userCode;
		this.verificationUrl = verificationUrl;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Sign in to Github Copilot" });
		const box = contentEl.createEl("div", {
			text: `To sign in, visit `,
			cls: "copilot-modal-auth-box",
		});
		box.createEl("a", {
			text: this.verificationUrl,
			attr: { href: this.verificationUrl },
		});
		box.createEl("span", {
			text: ` and enter the following code: `,
		});
		box.createEl("strong", {
			text: this.userCode,
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Copy code to clipboard").onClick(() => {
					navigator.clipboard.writeText(this.userCode);
				}),
			)
			.addButton((btn) =>
				btn
					.setButtonText(
						"Once you've signed in, click here to continue",
					)
					.setCta()
					.onClick(async () => {
						new Notice("Signing in...");
						this.plugin.copilotAgent
							.getClient()
							.confirmSignIn(this.userCode)
							.then((res) => {
								if (res.status === "OK") {
									new Notice("Signed in successfully!");
									this.plugin.copilotAgent
										.getClient()
										.setEditorInfo();
								} else {
									new Notice(
										"Failed to sign in: " +
											res?.error?.message,
									);
								}
								this.close();
							});
					}),
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default AuthModal;
