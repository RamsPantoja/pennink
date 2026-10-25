import { useState, useEffect, useRef } from "react";
import {
	Play,
	Pause,
	Square,
	RotateCcw,
	Settings,
	Focus,
	Coffee,
	Brain,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Button } from "../common/Button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { sileo } from "sileo";

type TimerMode = "focus" | "rest";
type TimerStatus = "idle" | "running" | "paused";

interface Session {
	id: string;
	type: TimerMode;
	duration: number;
	completedAt: Date;
}

interface PomodoroSettings {
	focusTime: number; // in minutes
	restTime: number; // in minutes
}

export default function PomodoroTimer() {
	const t = useTranslations("PomodoroTimer");
	const [openTimer, setOpenTimer] = useState<boolean>(false);
	const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
	const [mode, setMode] = useState<TimerMode>("focus");
	const [status, setStatus] = useState<TimerStatus>("idle");
	const [sessions, setSessions] = useState<Session[]>([]);
	const [settings, setSettings] = useState<PomodoroSettings>({
		focusTime: 25,
		restTime: 5,
	});
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Load settings and sessions from localStorage on mount
	useEffect(() => {
		const savedSettings = localStorage.getItem("pomodoro-settings");
		const savedSessions = localStorage.getItem("pomodoro-sessions");

		if (savedSettings) {
			const parsedSettings = JSON.parse(savedSettings);
			setSettings(parsedSettings);
			setTempSettings(parsedSettings);
			setTimeLeft(parsedSettings.focusTime * 60);
		}

		if (savedSessions) {
			const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
				...session,
				completedAt: new Date(session.completedAt),
			}));
			setSessions(parsedSessions);
		}
	}, []);

	// Save settings to localStorage
	useEffect(() => {
		localStorage.setItem("pomodoro-settings", JSON.stringify(settings));
	}, [settings]);

	// Save sessions to localStorage
	useEffect(() => {
		localStorage.setItem("pomodoro-sessions", JSON.stringify(sessions));
	}, [sessions]);

	// Timer logic
	useEffect(() => {
		if (status === "running" && timeLeft > 0) {
			intervalRef.current = setInterval(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
		} else if (timeLeft === 0 && status === "running") {
			// Timer completed
			handleTimerComplete();
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [status, timeLeft]);

	const handleTimerComplete = () => {
		// Add completed session
		const newSession: Session = {
			id: Date.now().toString(),
			type: mode,
			duration: mode === "focus" ? settings.focusTime : settings.restTime,
			completedAt: new Date(),
		};
		setSessions((prev) => [newSession, ...prev]);

		// Switch mode and reset timer
		const nextMode: TimerMode = mode === "focus" ? "rest" : "focus";
		setMode(nextMode);
		setTimeLeft(
			nextMode === "focus" ? settings.focusTime * 60 : settings.restTime * 60,
		);
		setStatus("idle");

		// Play notification sound (browser notification)
		if ("Notification" in window && Notification.permission === "granted") {
			new Notification(
				`${mode === "focus" ? t("focusSession") : t("restSession")} ${t("completed")}!`,
				{
					body: `${t("timeFor")} ${nextMode === "focus" ? t("focusSession").toLowerCase() : t("restSession").toLowerCase()} ${t("session")}.`,
					icon: "/favicon.svg",
					badge: "/favicon.svg",
				},
			);
			const audio = new Audio("/long-pop-notification.wav");
			audio.volume = 1;
			audio.play().catch((error) => {
				console.warn("Could not play notification sound:", error);
			});
		}
	};

	const handleStart = () => {
		if ("Notification" in window && Notification.permission !== "granted") {
			Notification.requestPermission();
		}
		setStatus("running");
	};

	const handlePause = () => {
		setStatus("paused");
	};

	const handleStop = () => {
		setStatus("idle");
		setTimeLeft(
			mode === "focus" ? settings.focusTime * 60 : settings.restTime * 60,
		);
	};

	const handleReset = () => {
		setStatus("idle");
		setMode("focus");
		setTimeLeft(settings.focusTime * 60);
	};

	const handleSaveSettings = () => {
		setSettings(tempSettings);
		setIsSettingsOpen(false);
		sileo.show({ title: t("settingsSaved") });
		// Reset timer with new settings if idle
		if (status === "idle") {
			setTimeLeft(
				mode === "focus"
					? tempSettings.focusTime * 60
					: tempSettings.restTime * 60,
			);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getTodaySessions = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return sessions.filter((session) => {
			const sessionDate = new Date(session.completedAt);
			sessionDate.setHours(0, 0, 0, 0);
			return sessionDate.getTime() === today.getTime();
		});
	};

	const todaySessions = getTodaySessions();
	const focusSessionsToday = todaySessions.filter(
		(s) => s.type === "focus",
	).length;
	const restSessionsToday = todaySessions.filter(
		(s) => s.type === "rest",
	).length;

	return (
		<Popover open={openTimer} onOpenChange={setOpenTimer}>
			<div className="flex items-center border border-muted rounded-md bg-card">
				<div className="flex items-center">
					{status === "idle" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="icon" variant="ghost" onClick={handleStart}>
									<Play className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("startSession")}</TooltipContent>
						</Tooltip>
					)}
					{status === "running" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button onClick={handlePause} variant="ghost" size="icon">
									<Pause className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("pauseSession")}</TooltipContent>
						</Tooltip>
					)}
					{status === "paused" && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button onClick={handleStart} size="icon" variant="ghost">
										<Play className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("resumeSession")}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button onClick={handleStop} variant="ghost" size="icon">
										<Square className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("stopSession")}</TooltipContent>
							</Tooltip>
						</>
					)}
					{status !== "idle" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button onClick={handleReset} variant="ghost" size="icon">
									<RotateCcw className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("resetSession")}</TooltipContent>
						</Tooltip>
					)}
				</div>
				<p className="text-xs text-foreground px-2 tracking-wider font-semibold">
					{formatTime(timeLeft)}
				</p>
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon">
								<Image
									src={"/icons/pomodoro-technique.png"}
									width={24}
									height={24}
									alt={t("pomodoroIconAlt")}
								/>
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent>{t("pomodoroDetails")}</TooltipContent>
				</Tooltip>
			</div>
			<PopoverContent className="max-h-(--radix-popover-content-available-height) overflow-auto">
				<div className="flex flex-col gap-4">
					{/* Main Timer */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<p className="flex items-center gap-2 font-semibold">
								{mode === "focus" ? (
									<>
										<Focus className="h-5 w-5" />
										{t("focusSession")}
									</>
								) : (
									<>
										<Coffee className="h-5 w-5" />
										{t("restBreak")}
									</>
								)}
							</p>
							<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
								<DialogTrigger asChild>
									<Button variant="outline" size="sm">
										<Settings className="h-4 w-4" />
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>{t("timerSettings")}</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div className="flex flex-col gap-2">
											<Label htmlFor="focus-time" className="text-foreground">
												{t("focusTime")}
											</Label>
											<div className="flex items-center gap-4">
												<Input
													id="focus-time"
													type="number"
													min="1"
													max="60"
													value={tempSettings.focusTime}
													onChange={(e) =>
														setTempSettings((prev) => ({
															...prev,
															focusTime: Number.parseInt(e.target.value) || 25,
														}))
													}
												/>
												<span className="text-xs text-muted-foreground">
													{t("minutes")}
												</span>
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<Label htmlFor="rest-time" className="text-foreground">
												{t("restTime")}
											</Label>
											<div className="flex items-center gap-4">
												<Input
													id="rest-time"
													type="number"
													min="1"
													max="30"
													value={tempSettings.restTime}
													onChange={(e) =>
														setTempSettings((prev) => ({
															...prev,
															restTime: Number.parseInt(e.target.value) || 5,
														}))
													}
												/>
												<span className="text-xs text-muted-foreground">
													{t("minutes")}
												</span>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												onClick={() => {
													setTempSettings(settings);
													setIsSettingsOpen(false);
												}}
												className="flex-1"
											>
												{t("cancel")}
											</Button>
											<Button onClick={handleSaveSettings} className="flex-1">
												{t("saveSettings")}
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
						<div className="flex-col flex gap-4 py-4">
							<div className="font-bold text-primary tracking-wider text-4xl text-center">
								{formatTime(timeLeft)}
							</div>
							<div className="flex justify-center gap-2 w-full flex-wrap">
								{status === "idle" && (
									<Button
										variant="teal"
										onClick={handleStart}
										className="gap-2"
									>
										<Play className="h-5 w-5" />
										{t("start")}
									</Button>
								)}
								{status === "running" && (
									<Button
										onClick={handlePause}
										variant="secondary"
										className="gap-2"
									>
										<Pause className="h-5 w-5" />
										{t("pause")}
									</Button>
								)}
								{status === "paused" && (
									<>
										<Button onClick={handleStart} className="gap-2">
											<Play className="h-5 w-5" />
											{t("resume")}
										</Button>
										<Button
											onClick={handleStop}
											variant="secondary"
											className="gap-2"
										>
											<Square className="h-5 w-5" />
											{t("stop")}
										</Button>
									</>
								)}
								{status !== "idle" && (
									<Button
										onClick={handleReset}
										variant="outline"
										className="gap-2 bg-transparent"
									>
										<RotateCcw className="h-5 w-5" />
										{t("reset")}
									</Button>
								)}
							</div>
							<div className="flex justify-center gap-4 text-sm text-muted-foreground">
								<span>
									{t("focus")}: {settings.focusTime} {t("min")}
								</span>
								<span>•</span>
								<span>
									{t("rest")}: {settings.restTime} {t("min")}
								</span>
							</div>
						</div>
					</div>
					{/* Today's Stats */}
					<Card className="border flex gap-4 flex-col">
						<p className="text-foreground text-sm">{t("todayProgress")}</p>
						<div className="grid grid-cols-2 gap-4 text-center">
							<div>
								<div className="font-bold text-primary">
									{focusSessionsToday}
								</div>
								<div className="text-xs text-muted-foreground">
									{t("focusSessions")}
								</div>
							</div>
							<div>
								<div className="font-bold text-secondary">
									{restSessionsToday}
								</div>
								<div className="text-xs text-muted-foreground">
									{t("restBreaks")}
								</div>
							</div>
						</div>
					</Card>
					{/* Session History */}
					<Card className="border flex gap-4 flex-col">
						<p className="text-foreground text-sm">{t("todaySessions")}</p>
						<div>
							{sessions.length === 0 ? (
								<p className="text-center text-muted-foreground py-4 text-xs">
									{t("noSessionsCompleted")}
								</p>
							) : (
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{sessions.slice(0, 10).map((session, index) => (
										<div key={session.id}>
											<div className="flex justify-between py-2 flex-col gap-2">
												<span className="text-xs text-muted-foreground">
													{session.completedAt.toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												<div className="flex items-center gap-2 justify-between">
													<Badge
														variant={
															session.type === "focus" ? "outline" : "secondary"
														}
													>
														{session.type === "focus" ? (
															<>
																<Focus className="h-3 w-3 mr-1" />
																{t("focus")}
															</>
														) : (
															<>
																<Coffee className="h-3 w-3 mr-1" />
																{t("rest")}
															</>
														)}
													</Badge>
													<span className="text-sm">
														{session.duration} {t("minutes")}
													</span>
												</div>
											</div>
											{index < sessions.slice(0, 10).length - 1 && (
												<Separator />
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</Card>
				</div>
			</PopoverContent>
		</Popover>
	);
}
