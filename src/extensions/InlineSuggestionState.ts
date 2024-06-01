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
	suggestion: string | null;
};

export const InlineSuggestionEffect = StateEffect.define<InlineSuggestion>();

export const inlineSuggestionField = StateField.define<string | null>({
	create(state: EditorState) {
		return null;
	},
	update(value: string | null, state: Transaction) {
		const inlineSuggestion = state.effects.find((effect) =>
			effect.is(InlineSuggestionEffect),
		);

		if (inlineSuggestion) {
			return inlineSuggestion.value.suggestion;
		}

		if (value && !state.docChanged) {
			return value;
		}

		return null;
	},
});

export const cancelSuggestion = (view: EditorView) => {
	sleep(1).then(() => {
		view.dispatch({
			effects: InlineSuggestionEffect.of({
				suggestion: null,
				// doc: doc,
			}),
		});
	});
};

export const acceptSuggestion = (view: EditorView) => {
	const suggestion = view.state.field(inlineSuggestionField);
	if (suggestion) {
		insertSuggestion(view, suggestion);
		cancelSuggestion(view);
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
