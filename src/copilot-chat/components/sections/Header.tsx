import React from "react";
import { concat } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-header";

const Header: React.FC = () => {
	return (
		<header className={concat(BASE_CLASSNAME, "container")}>
			<h6 className={concat(BASE_CLASSNAME, "title")}>Chat</h6>
			<button className={concat(BASE_CLASSNAME, "button")}>+</button>
		</header>
	);
};

export default Header;
