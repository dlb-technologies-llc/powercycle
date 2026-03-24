import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearToken, setToken } from "./api";

// Auth
export const useLogin = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { username: string; password: string }) =>
			apiFetch<{ success: boolean; token: string; userId: string }>(
				"/api/auth/login",
				{ method: "POST", body: JSON.stringify(data) },
			),
		onSuccess: (data) => {
			setToken(data.token);
			queryClient.invalidateQueries();
		},
	});
};

export const useLogout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () =>
			apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
		onSuccess: () => {
			clearToken();
			queryClient.clear();
		},
	});
};

// Cycles
export const useCurrentCycle = () =>
	useQuery({
		queryKey: ["cycles", "current"],
		queryFn: () => apiFetch<unknown>("/api/cycles/current"),
		retry: false,
	});

export const useCreateCycle = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			squat: number;
			bench: number;
			deadlift: number;
			ohp: number;
			unit: string;
		}) =>
			apiFetch<unknown>("/api/cycles", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
	});
};

// Workouts
export const useNextWorkout = () =>
	useQuery({
		queryKey: ["workouts", "next"],
		queryFn: () => apiFetch<unknown>("/api/workouts/next"),
		retry: false,
	});

export const useStartWorkout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { cycleId: string; round: number; day: number }) =>
			apiFetch<unknown>("/api/workouts", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
	});
};

export const useLogSet = () =>
	useMutation({
		mutationFn: ({
			workoutId,
			...setData
		}: {
			workoutId: string;
			exerciseName: string;
			setNumber: number;
			prescribedWeight?: number | null;
			actualWeight?: number | null;
			prescribedReps?: number | null;
			actualReps?: number | null;
			rpe?: number | null;
			isMainLift: boolean;
			isAmrap: boolean;
		}) =>
			apiFetch<unknown>(`/api/workouts/${workoutId}/sets`, {
				method: "POST",
				body: JSON.stringify(setData),
			}),
	});

export const useCompleteWorkout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (workoutId: string) =>
			apiFetch<unknown>(`/api/workouts/${workoutId}/complete`, {
				method: "POST",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workouts"] });
			queryClient.invalidateQueries({ queryKey: ["cycles"] });
		},
	});
};

export const useWorkoutHistory = () =>
	useQuery({
		queryKey: ["workouts", "history"],
		queryFn: () => apiFetch<unknown[]>("/api/workouts/history"),
		retry: false,
	});

// Progression
export const useCalculateProgression = () =>
	useMutation({
		mutationFn: (data: {
			squat: { weight: number; reps: number };
			bench: { weight: number; reps: number };
			deadlift: { weight: number; reps: number };
			ohp: { weight: number; reps: number };
		}) =>
			apiFetch<unknown>("/api/cycles/progress", {
				method: "POST",
				body: JSON.stringify(data),
			}),
	});

export const useStartNextCycle = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			squat: number;
			bench: number;
			deadlift: number;
			ohp: number;
			unit: string;
		}) =>
			apiFetch<unknown>("/api/cycles/next", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cycles"] });
			queryClient.invalidateQueries({ queryKey: ["workouts"] });
		},
	});
};
