import { create } from 'zustand';
import axios from '@/api/axios';
import type { Task, TaskStatus, TaskPriority, Tag } from '@/types';

// ── Payload types ─────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string;
    tags: string[]; // tag names
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    due_date?: string;
    order?: number;
    tags?: string[]; // tag names
}

// ── Store state & actions ─────────────────────────────────────────────────────

interface TaskStore {
    // Date
    selectedDate: string; // YYYY-MM-DD
    setSelectedDate: (date: string) => void;

    // Tasks
    tasks: Task[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchTasks: (date: string) => Promise<void>;
    addTask: (payload: CreateTaskPayload) => Promise<Task>;
    updateTask: (id: number, payload: UpdateTaskPayload) => Promise<Task>;
    deleteTask: (id: number) => Promise<void>;
    moveTask: (id: number, newStatus: TaskStatus) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set, get) => ({
    selectedDate: todayISO(),
    tasks: [],
    isLoading: false,
    error: null,

    setSelectedDate: (date: string) => {
        set({ selectedDate: date });
        get().fetchTasks(date);
    },

    fetchTasks: async (date: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.get<{ tasks: Task[] }>(`/api/tasks/?date=${date}`);
            set({ tasks: res.data.tasks, isLoading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.error || 'Failed to fetch tasks',
                isLoading: false,
            });
        }
    },

    addTask: async (payload: CreateTaskPayload): Promise<Task> => {
        const res = await axios.post<{ task: Task }>('/api/tasks/', payload);
        const newTask = res.data.task;
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return newTask;
    },

    updateTask: async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
        const res = await axios.patch<{ task: Task }>(`/api/tasks/${id}/`, payload);
        const updatedTask = res.data.task;
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        }));
        return updatedTask;
    },

    deleteTask: async (id: number): Promise<void> => {
        await axios.delete(`/api/tasks/${id}/`);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    },

    moveTask: async (id: number, newStatus: TaskStatus): Promise<void> => {
        // Optimistically update UI
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, status: newStatus } : t
            ),
        }));
        try {
            await axios.patch(`/api/tasks/${id}/`, { status: newStatus });
        } catch (err) {
            // Revert on failure by refetching
            get().fetchTasks(get().selectedDate);
        }
    },
}));
