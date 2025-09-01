import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

import { concat } from "../../../utils/style";

const BASE_CLASSNAME = "copilot-chat-mermaid";

interface MermaidDiagramProps {
	chart: string;
	isDarkTheme: boolean;
}

let mermaidInitialized = false;

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
	chart,
	isDarkTheme,
}) => {
	const [svg, setSvg] = useState<string>("");
	const [error, setError] = useState<string>("");
	const elementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const initializeMermaid = () => {
			if (!mermaidInitialized) {
				mermaid.initialize({
					startOnLoad: true,
					theme: isDarkTheme ? "dark" : "default",
					themeVariables: {
						fontFamily: "var(--font-interface)",
						fontSize: "14px",
					},
					flowchart: {
						useMaxWidth: true,
						htmlLabels: true,
					},
					sequence: {
						useMaxWidth: true,
					},
					gantt: {
						useMaxWidth: true,
					},
					pie: {
						useMaxWidth: true,
					},
				});
				mermaidInitialized = true;
			}
		};

		const renderMermaid = async () => {
			try {
				initializeMermaid();

				// Update theme if it changed
				mermaid.initialize({
					theme: isDarkTheme ? "dark" : "default",
				});

				const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Validate and render the mermaid chart
				const { svg } = await mermaid.render(uniqueId, chart);
				setSvg(svg);
				setError("");
			} catch (err) {
				console.error("Mermaid rendering error:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to render diagram",
				);
				setSvg("");
			}
		};

		renderMermaid();
	}, [chart, isDarkTheme]);

	if (error) {
		return (
			<div className={concat(BASE_CLASSNAME, "error")}>
				<div className={concat(BASE_CLASSNAME, "error-title")}>
					Failed to render Mermaid diagram
				</div>
				<pre className={concat(BASE_CLASSNAME, "error-message")}>
					{error}
				</pre>
			</div>
		);
	}

	if (!svg) {
		return (
			<div className={concat(BASE_CLASSNAME, "loading")}>
				Rendering diagram...
			</div>
		);
	}

	return (
		<div
			ref={elementRef}
			className={concat(BASE_CLASSNAME, "container")}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
};

export default MermaidDiagram;
