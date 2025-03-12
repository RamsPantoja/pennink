import EditorJS, {
	type OutputData,
	type BlockToolConstructable,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import EditorjsList from "@editorjs/list";
// import Quote from "@editorjs/quote";
// import Table from "@editorjs/table";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";

export type EditorProps = {
	onSave: (data: OutputData) => void;
	data: OutputData | null | undefined;
};

const Editor = ({ onSave, data }: EditorProps) => {
	const editorInstance = useRef<EditorJS | null>(null);

	useEffect(() => {
		if (!editorInstance.current) {
			const editor = new EditorJS({
				holder: "editorjs",
				placeholder: "Escribe, `/` para comandos...",
				tools: {
					header: {
						class: Header as unknown as BlockToolConstructable,
					},
					list: {
						class: EditorjsList as unknown as BlockToolConstructable,
					},
				},
				data: data ?? undefined,
				onChange: (api, event) => {
					api.saver.save().then((outputData) => {
						onSave(outputData);
					});
				},
			});

			editorInstance.current = editor;
		}

		// Cleanup: clear interval
		return () => {
			if (typeof editorInstance.current?.destroy === "function") {
				editorInstance.current.destroy();
				editorInstance.current = null;
			}
		};
	}, []);

	return (
		<Card
			id="editorjs"
			className="w-full h-full flex flex-col pl-20 markdown-styles prismjs-theme"
		/>
	);
};

export default Editor;
