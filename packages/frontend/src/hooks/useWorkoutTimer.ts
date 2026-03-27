import { useCallback, useEffect, useRef, useState } from "react";

export function useWorkoutTimer() {
	const [seconds, setSeconds] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const startTimeRef = useRef<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const start = useCallback(() => {
		startTimeRef.current = Date.now();
		setIsRunning(true);
		setSeconds(0);
		intervalRef.current = setInterval(() => {
			if (startTimeRef.current !== null) {
				setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
			}
		}, 1000);
	}, []);

	const stop = useCallback((): number => {
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsRunning(false);
		const elapsed =
			startTimeRef.current !== null
				? Math.floor((Date.now() - startTimeRef.current) / 1000)
				: 0;
		setSeconds(elapsed);
		return elapsed;
	}, []);

	const reset = useCallback(() => {
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsRunning(false);
		setSeconds(0);
		startTimeRef.current = null;
	}, []);

	useEffect(() => {
		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return { seconds, isRunning, start, stop, reset };
}
