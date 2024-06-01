import { keymap } from "@codemirror/view";

import { Prec } from "@codemirror/state";
import {
	acceptSuggestion,
	cancelSuggestion,
	inlineSuggestionField,
	offsetToPos,
} from "./InlineSuggestionState";
import { Hotkeys } from "../settings/CopilotPluginSettingTab";
import Cacher from "../copilot/Cacher";
import CopilotAgent from "../copilot/CopilotAgent";
import LSP from "../helpers/LSP";

export const inlineSuggestionKeyWatcher = (
	hotkeys: Hotkeys,
	agent: CopilotAgent,
) =>
	Prec.highest(
		keymap.of([
			{
				key: hotkeys.accept,
				run: (view) => {
					if (view.state.field(inlineSuggestionField)) {
						acceptSuggestion(view);
						return true;
					}
					return false;
				},
			},
			{
				key: hotkeys.cancel,
				run: (view) => {
					if (view.state.field(inlineSuggestionField)) {
						cancelSuggestion(view);
						return true;
					}
					return false;
				},
			},
			{
				key: hotkeys.request,
				run: (view) => {
					const didChangeParams = LSP.createDidChangeParams({
						uri: `${Cacher.getInstance().getCurrentFilePath().basePath}/${Cacher.getInstance().getCurrentFilePath().filePath}`,
						version: Cacher.getInstance().getCache(
							Cacher.getInstance().getCurrentFilePath().filePath,
						),
						text: view.state.doc.toString(),
					});

					agent
						.getClient()
						.didChange(didChangeParams)
						.then(() => {
							const cursor = offsetToPos(
								view.state.doc,
								view.state.selection.main.head,
							);
							const completionParams = LSP.createCompletionParams(
								{
									uri: `${Cacher.getInstance().getCurrentFilePath().basePath}/${Cacher.getInstance().getCurrentFilePath().filePath}`,
									relativePath:
										Cacher.getInstance().getCurrentFilePath()
											.filePath,
									line: cursor.line,
									character: cursor.ch,
									version: Cacher.getInstance().getCache(
										Cacher.getInstance().getCurrentFilePath()
											.filePath,
									),
								},
							);

							agent.triggerCompletions(view, completionParams);
						});

					return true;
				},
			},
		]),
	);
