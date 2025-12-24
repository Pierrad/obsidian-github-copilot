import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import {
	InlineSuggestion,
	cancelSuggestion,
	inlineSuggestionField,
} from "./InlineSuggestionState";

class InlineSuggestionPlugin {
	decorations: DecorationSet;
	suggestion: InlineSuggestion | null;

	constructor(view: EditorView) {
		this.decorations = Decoration.none;
		this.suggestion = null;
	}

	async update(update: ViewUpdate) {
		const suggestion: InlineSuggestion | null = update.state.field(
			inlineSuggestionField,
		);

		if (suggestion !== undefined) {
			this.suggestion = suggestion;
		}

		this.decorations = inlineSuggestionDecoration(
			update.view,
			this.suggestion,
		);
	}
}

export const inlineSuggestionPlugin = ViewPlugin.fromClass(
	InlineSuggestionPlugin,
	{
		decorations: (plugin) => plugin.decorations,
	},
);

function inlineSuggestionDecoration(
	view: EditorView,
	display_suggestion: InlineSuggestion | null,
) {
	const post = view.state.selection.main.head;

	if (!display_suggestion?.suggestions?.length) {
		return Decoration.none;
	}

	const suggestionObject =
		display_suggestion.suggestions[display_suggestion.index];
	const suggestionText = suggestionObject.insertText;

	try {
		const widget = new InlineSuggestionWidget(
			suggestionText,
			display_suggestion.index,
			display_suggestion.suggestions.length,
			view,
		);
		const decoration = Decoration.widget({
			widget,
			side: 1,
		});

		return Decoration.set([decoration.range(post)]);
	} catch (e) {
		return Decoration.none;
	}
}

class InlineSuggestionWidget extends WidgetType {
	constructor(
		readonly display_suggestion: string,
		readonly currentIndex: number,
		readonly nbSuggestions: number,
		readonly view: EditorView,
	) {
		super();
		this.display_suggestion = display_suggestion;
		this.view = view;
	}

	eq(other: InlineSuggestionWidget) {
		return other.display_suggestion == this.display_suggestion;
	}

	toDOM() {
		const span = document.createElement("span");
		span.textContent = this.display_suggestion;
		span.className = "copilot-inline-suggestion";
		span.onclick = () => {
			cancelSuggestion(this.view);
		};
		span.onselect = () => {
			cancelSuggestion(this.view);
		};

		if (this.nbSuggestions > 1) {
			const box = document.createElement("div");
			box.textContent = `${this.currentIndex + 1} / ${this.nbSuggestions}`;
			box.className = "copilot-inline-suggestion-box";

			span.appendChild(box);
		}

		return span;
	}

	destroy(dom: HTMLElement) {
		super.destroy(dom);
	}
}
