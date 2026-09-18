import { useWorkspaceStore } from "~/components/Workspace/useWorkspaceStore";

let currentAudio: HTMLAudioElement | null = null;
let currentSource: string | null = null;
let requestAbortController: AbortController | null = null;
let streamedText = "";
let audioQueue: Uint8Array[] = [];
let sourceBuffer: SourceBuffer | null = null;
let mediaSource: MediaSource | null = null;
let audioStarted = false;
let audioContext: AudioContext | null = null;
let audioAnalyser: AnalyserNode | null = null;
let canStreamMp3 = false;

const setIdle = () => {
	useWorkspaceStore.getState().setAudioState("idle");
	useWorkspaceStore.getState().setAgentActivity("idle");
};

const appendNextAudioChunk = () => {
	if (!sourceBuffer || sourceBuffer.updating || audioQueue.length === 0) return;
	const chunk = audioQueue.shift();
	if (chunk) sourceBuffer.appendBuffer(chunk as ArrayBuffer);
};

const startAudioPlayback = () => {
	if (audioStarted || !currentAudio) return;
	audioStarted = true;
	useWorkspaceStore.getState().setAudioState("playing");
	useWorkspaceStore.getState().setAgentActivity("speaking");
	void audioContext?.resume();
	void currentAudio.play().catch(() => {
		useWorkspaceStore.getState().setAudioState("error");
		useWorkspaceStore.getState().setAgentActivity("error");
	});
};

export const getAgentAudioAnalyser = () => audioAnalyser;

const beginSpeechStream = () => {
	if (typeof window === "undefined" || requestAbortController) return;

	streamedText = "";
	audioQueue = [];
	audioStarted = false;
	responseEnded = false;
	requestAbortController = new AbortController();
	canStreamMp3 =
		typeof MediaSource !== "undefined" &&
		MediaSource.isTypeSupported("audio/mpeg");

	if (canStreamMp3) {
		mediaSource = new MediaSource();
		currentSource = URL.createObjectURL(mediaSource);
	}

	currentAudio = new Audio(currentSource ?? undefined);
	currentAudio.preload = "auto";
	currentAudio.onended = stopAgentSpeech;

	audioContext = new AudioContext();
	audioAnalyser = audioContext.createAnalyser();
	audioAnalyser.fftSize = 256;
	audioAnalyser.smoothingTimeConstant = 0.82;
	const audioSource = audioContext.createMediaElementSource(currentAudio);
	audioSource.connect(audioAnalyser);
	audioAnalyser.connect(audioContext.destination);

	if (mediaSource) {
		mediaSource.addEventListener(
			"sourceopen",
			() => {
				if (!mediaSource) return;
				sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
				sourceBuffer.addEventListener("updateend", () => {
					appendNextAudioChunk();
					if (
						mediaSource?.readyState === "open" &&
						responseEnded &&
						audioQueue.length === 0 &&
						!sourceBuffer?.updating
					) {
						mediaSource.endOfStream();
					}
				});
				appendNextAudioChunk();
			},
			{ once: true },
		);
	}

	useWorkspaceStore.getState().setAudioState("loading");
};

const requestSpeechAudio = (text: string) => {
	void fetch("/api/ai/speak", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text }),
		signal: requestAbortController?.signal,
	})
		.then(async (response) => {
			if (!response.ok || !response.body) {
				throw new Error("Speech stream request failed");
			}

			console.log("[AGENT SPEECH] request stream started");

			const reader = response.body.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				audioQueue.push(value);
				if (canStreamMp3) {
					appendNextAudioChunk();
					startAudioPlayback();
				}
			}
			responseEnded = true;
			if (!canStreamMp3 && currentAudio) {
				currentSource = URL.createObjectURL(
					new Blob(audioQueue, { type: "audio/mpeg" }),
				);
				currentAudio.src = currentSource;
				currentAudio.load();
				startAudioPlayback();
			}
			if (
				mediaSource?.readyState === "open" &&
				audioQueue.length === 0 &&
				!sourceBuffer?.updating
			) {
				mediaSource.endOfStream();
			}
		})
		.catch((error: unknown) => {
			if ((error as Error).name === "AbortError") return;
			useWorkspaceStore.getState().setAudioState("error");
			useWorkspaceStore.getState().setAgentActivity("error");
			console.error("[AGENT SPEECH ERROR]:", error);
		});
};

let responseEnded = false;

export const stopAgentSpeech = () => {
	requestAbortController?.abort();
	requestAbortController = null;
	currentAudio?.pause();
	void audioContext?.close();
	audioContext = null;
	audioAnalyser = null;
	currentAudio = null;
	if (currentSource) URL.revokeObjectURL(currentSource);
	currentSource = null;
	mediaSource = null;
	sourceBuffer = null;
	audioQueue = [];
	canStreamMp3 = false;
	streamedText = "";
	responseEnded = false;
	setIdle();
};

export const streamAgentSpeech = (text: string, done = false) => {
	if (typeof window === "undefined" || !text.trim()) return;
	if (!requestAbortController) beginSpeechStream();

	streamedText = text;

	if (done) finishAgentSpeech();
};

export const finishAgentSpeech = () => {
	if (!requestAbortController || !streamedText.trim()) return;
	requestSpeechAudio(streamedText);
};

export const playAgentSpeech = async (text: string) => {
	if (typeof window === "undefined" || !text.trim()) return false;
	stopAgentSpeech();
	streamAgentSpeech(text);
	finishAgentSpeech();
	return true;
};
