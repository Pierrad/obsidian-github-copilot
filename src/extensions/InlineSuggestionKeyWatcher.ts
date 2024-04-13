import { keymap } from "@codemirror/view";

import { Prec } from "@codemirror/state";
import { acceptSuggestion, cancelSuggestion } from "./InlineSuggestionState";

export const inlineSuggestionKeyWatcher = Prec.highest(
	keymap.of([
		{
			key: "Tab",
			run: (view) => {
				acceptSuggestion(view);
				return true;
			},
		},
		{
			key: "Escape",
			run: (view) => {
				cancelSuggestion(view);
				return true;
			},
		},
	]),
);
