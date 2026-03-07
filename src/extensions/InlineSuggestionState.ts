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

interface Range {
	start: Position;
	end: Position;
}

interface Position {
	line: number;
	character: number;
}

export type CompletionWithRange = {
	insertText: string;
	range?: Range;
};

export type InlineSuggestion = {
	suggestions: CompletionWithRange[] | null;
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

export function convertLSPRangeToOffsets(
	doc: Text,
	range: Range,
): [number, number] {
	const docLines = doc.lines;

	const startLineNum =
		Math.max(0, Math.min(range.start.line, docLines - 1)) + 1;
	const endLineNum = Math.max(0, Math.min(range.end.line, docLines - 1)) + 1;

	const startLine = doc.line(startLineNum);
	const endLine = doc.line(endLineNum);

	const startChar = Math.max(
		0,
		Math.min(range.start.character, startLine.length),
	);
	const endChar = Math.max(0, Math.min(range.end.character, endLine.length));

	const from = startLine.from + startChar;
	const to = endLine.from + endChar;

	return [Math.min(from, to), Math.max(from, to)];
}

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
		const currentSuggestion =
			suggestionField.suggestions?.[suggestionField.index];
		if (currentSuggestion) {
			insertSuggestion(
				view,
				currentSuggestion.insertText,
				currentSuggestion.range,
			);
		}
		cancelSuggestion(view);
	}
};

export const partialAcceptSuggestion = (view: EditorView) => {
	const suggestionField = view.state.field(inlineSuggestionField);
	if (suggestionField) {
		const currentSuggestion =
			suggestionField.suggestions?.[suggestionField.index];
		if (currentSuggestion) {
			const cursorPos = view.state.selection.main.head;
			let remainingText = currentSuggestion.insertText;

			// Strip already-typed prefix (same logic as display layer)
			if (currentSuggestion.range) {
				const [from] = convertLSPRangeToOffsets(
					view.state.doc,
					currentSuggestion.range,
				);
				const existingText = view.state.doc.sliceString(
					from,
					cursorPos,
				);
				if (remainingText.startsWith(existingText)) {
					remainingText = remainingText.slice(existingText.length);
				}
			}

			// Extract first word (+ optional trailing space)
			const match = remainingText.match(/^(\S+\s?)/);
			if (!match) return;
			const wordChunk = match[1];
			const afterAccept = remainingText.slice(wordChunk.length);

			view.dispatch({
				...createInsertSuggestionTransaction(
					view.state,
					wordChunk,
					cursorPos,
					cursorPos,
				),
			});

			if (!afterAccept.trim()) {
				cancelSuggestion(view);
				return;
			}

			const newSuggestions = suggestionField.suggestions?.map(
				(suggestion, i) => {
					if (i === suggestionField.index) {
						return {
							...suggestion,
							insertText: afterAccept,
							range: undefined,
						};
					}
					return suggestion;
				},
			) as CompletionWithRange[];

			view.dispatch({
				effects: InlineSuggestionEffect.of({
					...suggestionField,
					suggestions: newSuggestions,
				}),
			});
		}
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

export const insertSuggestion = (
	view: EditorView,
	suggestion: string,
	range?: Range,
) => {
	let from: number;
	let to: number;

	if (range) {
		[from, to] = convertLSPRangeToOffsets(view.state.doc, range);
	} else {
		from = view.state.selection.main.from;
		to = view.state.selection.main.to;
	}

	view.dispatch({
		...createInsertSuggestionTransaction(view.state, suggestion, from, to),
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
		return { changes: [] };
	}

	const createInsertSuggestionTransactionFromSelectionRange = (
		range: SelectionRange,
	) => {
		if (range === state.selection.main) {
			return {
				changes: { from, to, insert: text },
				range: EditorSelection.cursor(from + text.length),
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
