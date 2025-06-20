import React from "react";
import { copilotIcon } from "../../../assets/copilot";
import { concat, cx } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-no-history";

const NoHistory: React.FC = () => {
	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div
				dangerouslySetInnerHTML={{ __html: copilotIcon }}
				className={cx(
					concat(BASE_CLASSNAME, "icon"),
					"copilot-big-icon",
				)}
			/>
			<h1
				className={cx(
					concat(BASE_CLASSNAME, "title"),
					"copilot-chat-title",
				)}
			>
				Ask Copilot
			</h1>

			<p
				className={cx(
					concat(BASE_CLASSNAME, "text"),
					"copilot-chat-subtitle",
				)}
			>
				Copilot is powered by AI, so mistakes are possible. Review
				output carefully before use.
			</p>

			<div className="copilot-chat-model-warning">
				<h6 className="copilot-chat-model-warning-title">
					Model Activation Required
				</h6>
				<p className="copilot-chat-model-warning-text">
					To use Claude or Gemini models, you might need to enable
					them in your IDE first. Make a request in your IDE and click
					"Enable" when prompted.
				</p>
			</div>

			<div className="copilot-chat-model-warning">
				<h6 className="copilot-chat-model-warning-title">
					Some users have seen their Copilot access suspended after
					using this Chat extension.
				</h6>
				<p className="copilot-chat-model-warning-text">
					If you experience this, you can try to restore your access
					by contacting GitHub support. Use this chat extension at
					your own risk. Please see{" "}
					<a href="https://github.com/ivan-mezentsev/obsidian-github-copilot-native/issues/67">
						the following issue for more details.
					</a>
				</p>
			</div>
		</div>
	);
};

export default NoHistory;
