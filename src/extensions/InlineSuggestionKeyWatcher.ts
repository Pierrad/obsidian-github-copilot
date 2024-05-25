import { keymap } from "@codemirror/view";

import { Prec } from "@codemirror/state";
import {
	acceptSuggestion,
	cancelSuggestion,
	inlineSuggestionField,
} from "./InlineSuggestionState";
import { Hotkeys } from "../settings/CopilotPluginSettingTab";

export const inlineSuggestionKeyWatcher = (hotkeys: Hotkeys) =>
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
		]),
	);
