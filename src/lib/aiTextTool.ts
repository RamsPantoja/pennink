import Paragraph from "@editorjs/paragraph";
import type {
	TAITextApi,
	TAITextCSS,
	TAITextCallback,
	TAITextConstructor,
	TAITextData,
	TAITextElement,
	TAITextReadOnly,
} from "../types/aitext";
import { debounce } from "./utils";

export class AIText extends Paragraph {
	private callback: TAITextCallback;
	private _element: TAITextElement;
	private _CSS: TAITextCSS;
	private _data: TAITextData;
	private readOnly: TAITextReadOnly = false;
	private api: TAITextApi;

	static get toolbox() {
		return {
			title: "AI Text",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
</svg>
`,
		};
	}

	constructor({ api, block, config, data }: TAITextConstructor) {
		super({
			api,
			block,
			config,
			data,
		});

		if (!config.callback) {
			throw new Error("Callback function is required!");
		}

		this.callback = config.callback;
	}

	getAICompletion(content: string) {
		if (!content) return;

		this.callback?.(content)
			.then((response) => {
				const aiSuggestions = document.createElement("span");
				aiSuggestions.innerHTML = "";
				aiSuggestions.id = "ai-suggestions";
				aiSuggestions.style.color = "lightgray";
				aiSuggestions.innerHTML = response;
				const di

				this._element?.appendChild(aiSuggestions);

				this._element?.querySelector("#ai-suggestions-loader")?.remove();
			})
			.catch((error) => {
				throw new Error(error);
			});
	}

	onInput = debounce((e) => {
		if (
			this._element?.querySelector("#ai-suggestions") ||
			e.inputType === "deleteContentBackward" ||
			e.inputType === "deleteContentForward" ||
			e.inputType === "insertParagraph" ||
			e.inputType === "insertFromPaste" ||
			e.inputType === "insertFromDrop" ||
			!e.target.innerHTML
		) {
			return;
		}

		this.getAICompletion(e.target.innerHTML);
	});

	onKeyUp(e: { code: string }) {
		if (e.code === "Escape" || e.code === "Backspace") {
			this._element?.querySelector("#ai-suggestions")?.remove();

			return;
		}

		if (e.code === "Alt" && e.code === "L") {
			const aiSuggestionElement =
				this._element?.querySelector("#ai-suggestions");
			const aiSuggestionElementTextContent = aiSuggestionElement?.textContent;

			if (!aiSuggestionElementTextContent) return;

			const aiSuggestionTextNode = document.createTextNode(
				aiSuggestionElementTextContent,
			);

			this._element?.appendChild(aiSuggestionTextNode);
			aiSuggestionElement.remove();

			return;
		}

		if ((e.code !== "Backspace" && e.code !== "Delete") || !this._element) {
			return;
		}

		const { textContent } = this._element;

		if (textContent === "") {
			this._element.innerHTML = "";
		}
	}

	drawView() {
		const div = document.createElement("DIV");

		div.classList.add(this._CSS.wrapper, this._CSS.block);
		div.contentEditable = "false";
		div.dataset.placeholder = this.api.i18n.t(this._placeholder);

		if (this._data.text) {
			div.innerHTML = this._data.text;
		}

		if (!this.readOnly) {
			div.contentEditable = "true";
			div.addEventListener("keyup", this.onKeyUp);
			div.addEventListener("input", this.onInput);
		}

		return div;
	}

	private _placeholder(_placeholder: any): string | undefined {
		throw new Error("Method not implemented.");
	}
}
