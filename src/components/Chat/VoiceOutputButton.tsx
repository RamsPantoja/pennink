"use client";

import { SpeakerWaveIcon, StopIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { playAgentSpeech, stopAgentSpeech } from "~/lib/agentAudio";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";

export const VoiceOutputButton = ({ text }: { text: string }) => {
	const audioState = useWorkspaceStore((state) => state.audioState);
	const playing = audioState === "playing" || audioState === "loading";

	const toggle = async () => {
		if (playing) {
			stopAgentSpeech();
			return;
		}
		await playAgentSpeech(text);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			type="button"
			onClick={toggle}
			aria-label={playing ? "Stop spoken response" : "Play spoken response"}
		>
			{playing ? (
				<StopIcon className="h-4 w-4" />
			) : (
				<SpeakerWaveIcon className="h-4 w-4" />
			)}
		</Button>
	);
};
