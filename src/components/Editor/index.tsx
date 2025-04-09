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
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";

export type EditorProps = {
	onSave: (data: OutputData) => void;
	data: OutputData | null | undefined;
};

const Editor = ({ onSave, data }: EditorProps) => {
	const { editorJS, setEditorJS } = useWorkspaceStore();

	useEffect(() => {
		if (!editorJS) {
			const editor = new EditorJS({
				holder: "editorjs",
				placeholder: "Type, `/` for commands...",
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

			setEditorJS(editor);
		}

		return () => {
			if (typeof editorJS?.destroy === "function") {
				editorJS.destroy();
				setEditorJS(null);
			}
		};
	}, [editorJS]);

	return (
		<Card
			id="editorjs"
			className="w-full h-full flex flex-col pl-20 markdown-styles prismjs-theme"
		/>
	);
};

export default Editor;
