"use client";

import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "pennink-active-classroom";
const CHANGE_EVENT = "pennink-active-classroom-change";

type ClassroomLike = {
	id: string;
	createdAt: Date;
};

const readStoredId = () => {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

const writeStoredId = (id: string) => {
	try {
		localStorage.setItem(STORAGE_KEY, id);
	} catch {
		// Storage can be unavailable (private mode); the choice then lasts for this session only.
	}
};

const subscribe = (onChange: () => void) => {
	window.addEventListener("storage", onChange);
	window.addEventListener(CHANGE_EVENT, onChange);

	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(CHANGE_EVENT, onChange);
	};
};

export const useActiveClassroom = (classrooms?: ClassroomLike[]) => {
	const storedId = useSyncExternalStore(subscribe, readStoredId, () => null);

	const activeId = useMemo(() => {
		if (!classrooms || classrooms.length === 0) return null;

		const stored = classrooms.find((classroom) => classroom.id === storedId);

		if (stored) return stored.id;

		const latest = classrooms.reduce((newest, classroom) =>
			new Date(classroom.createdAt).getTime() >
			new Date(newest.createdAt).getTime()
				? classroom
				: newest,
		);

		return latest.id;
	}, [classrooms, storedId]);

	const setActive = (id: string) => {
		writeStoredId(id);
		window.dispatchEvent(new Event(CHANGE_EVENT));
	};

	return { activeId, setActive };
};
