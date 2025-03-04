import EditorJS, { type BlockToolConstructable } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import EditorjsList from "@editorjs/list";
// import Quote from "@editorjs/quote";
// import Table from "@editorjs/table";
import { useEffect, useRef } from "react";
import { Card } from "../ui/card";

export type EditorProps = {
	onSave: () => void;
};

const Editor = ({ onSave }: EditorProps) => {
	const editorRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let editor: EditorJS | undefined;

		if (editorRef.current) {
			console.log("a");
			editor = new EditorJS({
				holder: editorRef.current,
				placeholder: "Escribe, `/` para comandos...",
				tools: {
					header: {
						class: Header as unknown as BlockToolConstructable,
					},
					list: {
						class: EditorjsList as unknown as BlockToolConstructable,
					},
				},
			});
		}

		// Cleanup: clear interval
		return () => {
			if (typeof editor?.destroy === "function") {
				editor?.destroy();
			}
		};
	}, []);

	return <Card ref={editorRef} id="editorjs" className="w-full h-full flex" />;
};

export default Editor;
