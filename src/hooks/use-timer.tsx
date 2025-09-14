import { useState, useEffect, useRef } from "react";

type UseTimerProps = {
	minutes: number;
	onFinish?: () => void;
};

export function useTimer({ minutes, onFinish }: UseTimerProps) {
	const [timeLeft, setTimeLeft] = useState(minutes * 60); // Convert minutes to seconds
	const [isRunning, setIsRunning] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Reset timer when minutes prop changes
	useEffect(() => {
		setTimeLeft(minutes * 60);
		setIsRunning(false);
		setIsFinished(false);
	}, [minutes]);

	// Timer logic
	useEffect(() => {
		console.log({ isRunning, timeLeft });
		if (isRunning && timeLeft > 0) {
			intervalRef.current = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false);
						setIsFinished(true);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;

				// Trigger the callback when timer finishes
				if (onFinish) {
					onFinish();
				}
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRunning, timeLeft, onFinish]);

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
