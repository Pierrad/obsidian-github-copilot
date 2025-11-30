import { setIcon } from "obsidian";
import React from "react";

export const ObsidianIcon: React.FC<{
	name: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ name, className, style }) => {
	const ref = React.useRef<HTMLSpanElement>(null);

	React.useEffect(() => {
		if (ref.current) {
			setIcon(ref.current, name);
		}
	}, [name]);

	return (
		<span
			ref={ref}
			className={className}
			style={{ display: "flex", ...style }}
		/>
	);
};
