import {
	EditorState,
	EditorSelection,
	SelectionRange,
	StateField,
	StateEffect,
	Transaction,
	TransactionSpec,
	Text,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export type InlineSuggestion = {
	suggestions: string[] | null;
	index: number;
};

export const InlineSuggestionEffect = StateEffect.define<InlineSuggestion>();

export const inlineSuggestionField = StateField.define<InlineSuggestion | null>(
	{
		create(state: EditorState) {
			return null;
		},
		update(value: InlineSuggestion | null, state: Transaction) {
			const inlineSuggestion = state.effects.find((effect) =>
				effect.is(InlineSuggestionEffect),
			);

			if (inlineSuggestion) {
				return inlineSuggestion.value;
			}

			if (
				value &&
				state.selection &&
				cursorHasMoved(state.startState.selection, state.selection)
			) {
				return null;
			}

			if (value && !state.docChanged) {
				return value;
			}

			return null;
		},
	},
);

export const cancelSuggestion = (view: EditorView) => {
	sleep(1).then(() => {
		view.dispatch({
			effects: InlineSuggestionEffect.of({
				suggestions: null,
				index: 0,
			}),
		});
	});
};

export const acceptSuggestion = (view: EditorView) => {
	const suggestionField = view.state.field(inlineSuggestionField);
	if (suggestionField) {
		insertSuggestion(
			view,
			suggestionField.suggestions?.[suggestionField.index] || "",
		);
		cancelSuggestion(view);
	}
};

export const partialAcceptSuggestion = (view: EditorView) => {
	const suggestionField = view.state.field(inlineSuggestionField);
	if (suggestionField) {
		const parts =
			suggestionField.suggestions?.[suggestionField.index]
				?.trim()
				.split(/\s+/) || [];
		const word = parts[0];
		const newSuggestionField = {
			...suggestionField,
			suggestions: suggestionField.suggestions?.map((suggestion) =>
				suggestion.replace(word, "").trim(),
			) as string[],
		};

		view.dispatch({
			...createInsertSuggestionTransaction(
				view.state,
				word + " ",
				view.state.selection.main.from,
				view.state.selection.main.to,
			),
		});

		view.dispatch({
			effects: InlineSuggestionEffect.of(newSuggestionField),
		});
	}
};

export const nextSuggestion = (view: EditorView) => {
	const suggestionField = view.state.field(inlineSuggestionField);
	if (suggestionField) {
		const nextIndex =
			(suggestionField.index + 1) %
			(suggestionField.suggestions?.length || 0);
		view.dispatch({
			effects: InlineSuggestionEffect.of({
				...suggestionField,
				index: nextIndex,
			}),
		});
	}
};

export const insertSuggestion = (view: EditorView, suggestion: string) => {
	view.dispatch({
		...createInsertSuggestionTransaction(
			view.state,
			suggestion,
			view.state.selection.main.from,
			view.state.selection.main.to,
		),
	});
};

function createInsertSuggestionTransaction(
	state: EditorState,
	text: string,
	from: number,
	to: number,
): TransactionSpec {
	const docLength = state.doc.length;
	if (from < 0 || to > docLength || from > to) {
		// If the range is not valid, return an empty transaction spec.
		return { changes: [] };
	}

	const createInsertSuggestionTransactionFromSelectionRange = (
		range: SelectionRange,
	) => {
		if (range === state.selection.main) {
			return {
				changes: { from, to, insert: text },
				range: EditorSelection.cursor(to + text.length),
			};
		}
		const length = to - from;
		if (hasTextChanged(from, to, state, range)) {
			return { range };
		}
		return {
			changes: {
				from: range.from - length,
				to: range.from,
				insert: text,
			},
			range: EditorSelection.cursor(range.from - length + text.length),
		};
	};

	return {
		...state.changeByRange(
			createInsertSuggestionTransactionFromSelectionRange,
		),
		userEvent: "input.complete",
	};
}

function hasTextChanged(
	from: number,
	to: number,
	state: EditorState,
	changeRange: SelectionRange,
) {
	if (changeRange.empty) {
		return false;
	}
	const length = to - from;
	if (length <= 0) {
		return false;
	}
	if (changeRange.to <= from || changeRange.from >= to) {
		return false;
	}
	// check out of bound
	if (changeRange.from < 0 || changeRange.to > state.doc.length) {
		return false;
	}

	return (
		state.sliceDoc(changeRange.from - length, changeRange.from) !=
		state.sliceDoc(from, to)
	);
}

export function offsetToPos(doc: Text, offset: number) {
	const line = doc.lineAt(offset);
	return { line: line.number - 1, ch: offset - line.from };
}

export function cursorHasMoved(
	oldState: EditorSelection,
	newState: EditorSelection,
) {
	return (
		oldState.main.from !== newState.main.from ||
		oldState.main.to !== newState.main.to
	);
}
