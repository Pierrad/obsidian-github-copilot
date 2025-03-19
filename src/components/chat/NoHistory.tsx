import React from "react";
import { copilotIcon } from "../../assets/copilot";
import { concat } from "../../utils/style";

const BASE_CLASSNAME = "copilot-chat-no-history";

const NoHistory: React.FC = () => {
	return (
		<div className={concat(BASE_CLASSNAME, "container")}>
			<div
				dangerouslySetInnerHTML={{ __html: copilotIcon }}
				className={concat(BASE_CLASSNAME, "icon")}
			/>
			<h1 className={concat(BASE_CLASSNAME, "title")}>Ask Copilot</h1>
			<p className={concat(BASE_CLASSNAME, "text")}>
				Copilot is powered by AI, so mistakes are possible. Review
				output carefully before use.
			</p>
		</div>
	);
};

export default NoHistory;
