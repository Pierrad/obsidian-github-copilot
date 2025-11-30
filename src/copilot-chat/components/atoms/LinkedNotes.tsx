import React from "react";
import { cx } from "../../../utils/style";
import { usePlugin } from "../../hooks/usePlugin";
import { TFile, Notice } from "obsidian";

const BASE_CLASSNAME = "copilot-chat-message";

export interface LinkedNoteItem {
	path: string;
	filename: string;
	content: string;
}

interface LinkedNotesProps {
	notes?: LinkedNoteItem[];
}

const LinkedNotes: React.FC<LinkedNotesProps> = ({ notes }) => {
	const plugin = usePlugin();

	if (!notes || notes.length === 0) return null;

	const openLinkedNote = (note: { path: string; filename: string }) => {
		if (!plugin) return;
		try {
			const file = plugin.app.vault.getAbstractFileByPath(note.path);
			if (file instanceof TFile) {
				// If already open in any leaf, activate that leaf
				const leaves = plugin.app.workspace.getLeavesOfType("markdown");
				const existing = leaves.find((leaf) => {
					type ViewWithFile = { file?: { path?: string } };
					const view = leaf.view as unknown as ViewWithFile;
					return view?.file?.path === file.path;
				});
				if (existing) {
					plugin.app.workspace.revealLeaf(existing);
					return;
				}

				// Otherwise open in a new leaf
				plugin.app.workspace
					.getLeaf(true)
					.openFile(file)
					.catch((e) => {
						console.error("Failed to open file", e);
						new Notice("Unable to open file: " + note.filename);
					});
			} else {
				plugin.app.workspace.openLinkText(note.filename, "", false);
			}
		} catch (e) {
			console.error("Open note error", e);
			new Notice("Failed to open note: " + note.filename);
		}
	};

	return (
		<div className={`${BASE_CLASSNAME}-linked-notes-list`}>
			{notes.map((note, index) => (
				<div
					key={index}
					className={cx(`${BASE_CLASSNAME}-linked-note`, "tag")}
					role="button"
					tabIndex={0}
					onClick={() => openLinkedNote(note)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							openLinkedNote(note);
						}
					}}
					aria-label={`Open note ${note.filename}`}
				>
					{note.filename}
				</div>
			))}
		</div>
	);
};

export { LinkedNotes };
