import React, { useEffect, useRef, useState } from "react";
import { concat, cx } from "../../../utils/style";
import CopilotPlugin from "../../../main";
import { TFile } from "obsidian";

const BASE_CLASSNAME = "copilot-chat-file-suggestion";

interface FileSuggestionProps {
	query: string;
	position?: { top: number; left: number };
	onSelect: (file: { path: string; filename: string }) => void;
	onClose: () => void;
	plugin: CopilotPlugin | undefined;
}

const FileSuggestion: React.FC<FileSuggestionProps> = ({
	query,
	position,
	onSelect,
	onClose,
	plugin,
}) => {
	const [files, setFiles] = useState<TFile[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!plugin) return;

		const markdownFiles = plugin.app.vault.getMarkdownFiles();

		const filtered = markdownFiles.filter(
			(file) =>
				file.path.toLowerCase().includes(query.toLowerCase()) ||
				file.basename.toLowerCase().includes(query.toLowerCase()),
		);

		setFiles(filtered);
		setSelectedIndex(0);
	}, [plugin, query]);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev + 1) % files.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex(
				(prev) => (prev - 1 + files.length) % files.length,
			);
		} else if (e.key === "Enter" || e.key === "Tab") {
			e.preventDefault();
			if (files[selectedIndex]) {
				handleSelect(files[selectedIndex]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);

		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [files, selectedIndex]);

	const handleSelect = (file: TFile) => {
		onSelect({
			path: file.path,
			filename: file.basename,
		});
	};

	const getDirectory = (path: string) => {
		// Normalize path by trimming leading/trailing slashes
		const normalized = (path || "").replace(/^\/+|\/+$/g, "");
		const parts = normalized.split("/").filter(Boolean);
		// If no folder part, it's root
		if (parts.length <= 1) return "";
		// Join folder parts and ensure a leading slash
		return "/" + parts.slice(0, -1).join("/");
	};

	return (
		<div className={concat(BASE_CLASSNAME, "container")} ref={containerRef}>
			{files.length === 0 ? (
				<div
					className={concat(BASE_CLASSNAME, "no-results")}
					style={{ padding: "10px", textAlign: "center" }}
				>
					No files found
				</div>
			) : (
				files.map((file, index) => (
					<div
						key={file.path}
						className={cx(
							concat(BASE_CLASSNAME, "item"),
							index === selectedIndex
								? concat(BASE_CLASSNAME, "item-selected")
								: "",
						)}
						onClick={() => handleSelect(file)}
					>
						<div className={concat(BASE_CLASSNAME, "item-name")}>
							{file.basename}
						</div>
						<div className={concat(BASE_CLASSNAME, "item-path")}>
							{getDirectory(file.path)}
						</div>
					</div>
				))
			)}
		</div>
	);
};

export default FileSuggestion;
