import { useState, useEffect, useRef } from "react";
import { useInterval } from "usehooks-ts";

type UseTimerProps = {
	minutes: number;
	onFinish?: () => void;
};

export function useTimer({ minutes, onFinish }: UseTimerProps) {
	const [timeLeft, setTimeLeft] = useState(minutes * 60); // Convert minutes to seconds
	const [isRunning, setIsRunning] = useState(false);
	const [isFinished, setIsFinished] = useState(false);

	// Reset timer when minutes prop changes
	useEffect(() => {
		setTimeLeft(minutes * 60);
		setIsRunning(false);
		setIsFinished(false);
	}, [minutes]);

	useInterval(() => {
		if (isRunning && timeLeft > 0) {
			if (timeLeft <= 1) {
				setIsRunning(false);
				setIsFinished(true);
				// Trigger the callback when timer finishes
				if (onFinish) {
					onFinish();
				}
			}

			setTimeLeft(timeLeft - 1);
		}
	}, 1000);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const onStart = () => {
		if (timeLeft > 0) {
			setIsRunning(true);
			setIsFinished(false);
		}
	};

	const onPause = () => {
		setIsRunning(false);
	};

	const onReset = () => {
		setIsRunning(false);
		setTimeLeft(minutes * 60);
		setIsFinished(false);
	};

	return {
		timeLeft,
		formatTime,
		onStart,
		onPause,
		onReset,
		isFinished,
		isRunning,
	};
}
