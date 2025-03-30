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
		</div>
	);
};

export default NoHistory;
