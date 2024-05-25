import { keymap } from "@codemirror/view";

import { Prec } from "@codemirror/state";
import {
	acceptSuggestion,
	cancelSuggestion,
	inlineSuggestionField,
} from "./InlineSuggestionState";

export const inlineSuggestionKeyWatcher = Prec.highest(
	keymap.of([
		{
			key: "Tab",
			run: (view) => {
				if (view.state.field(inlineSuggestionField)) {
					acceptSuggestion(view);
					return true;
				}
				return false;
			},
		},
		{
			key: "Escape",
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
