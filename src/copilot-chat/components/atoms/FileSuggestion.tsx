import React, { useEffect, useRef, useState } from "react";
import { concat, cx } from "../../../utils/style";
import CopilotPlugin from "../../../main";
import { TFile } from "obsidian";

const BASE_CLASSNAME = "copilot-chat-file-suggestion";

interface FileSuggestionProps {
	query: string;
	position: { top: number; left: number };
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
		} else if (e.key === "Enter") {
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
		const lastSlashIndex = path.lastIndexOf("/");
		if (lastSlashIndex === -1) return "";
		return path.substring(0, lastSlashIndex);
	};

	return (
		<div
			className={concat(BASE_CLASSNAME, "container")}
			style={{
				position: "absolute",
				top: `-200px`,
				left: `10px`,
				width: "calc(100% - 20px)",
				maxHeight: "200px",
				overflowY: "auto",
				zIndex: 1000,
				backgroundColor: "var(--background-primary)",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "4px",
				boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)",
			}}
			ref={containerRef}
		>
			{files.length === 0 ? (
				<div
					className={concat(BASE_CLASSNAME, "no-results")}
					style={{ padding: "10px", textAlign: "center" }}
				>
					No files found
				</div>
			) : (
				<div className={concat(BASE_CLASSNAME, "list")}>
					{files.map((file, index) => (
						<div
							key={file.path}
							className={cx(
								concat(BASE_CLASSNAME, "item"),
								index === selectedIndex
									? concat(BASE_CLASSNAME, "item-selected")
									: "",
							)}
							onClick={() => handleSelect(file)}
							style={{
								padding: "8px 10px",
								cursor: "pointer",
								borderBottom:
									"1px solid var(--background-modifier-border)",
								backgroundColor:
									index === selectedIndex
										? "var(--background-secondary)"
										: "transparent",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<div style={{ fontWeight: "500" }}>
								{file.basename}
							</div>
							{getDirectory(file.path) && (
								<div
									style={{
										fontSize: "0.8em",
										color: "var(--text-muted)",
										marginTop: "2px",
									}}
								>
									{getDirectory(file.path)}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default FileSuggestion;
