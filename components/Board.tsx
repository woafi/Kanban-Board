"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { TaskStatus } from '@/types';
import { useTaskStore } from '@/lib/task-store';
import Column from './Column';

const COLUMNS: TaskStatus[] = ['todo', 'inprogress', 'done'];

export default function Board() {
    const { tasks, isLoading, error, selectedDate, fetchTasks, moveTask } = useTaskStore();
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
    const draggingTaskId = useRef<number | null>(null);

    // Fetch whenever selected date changes
    useEffect(() => {
        fetchTasks(selectedDate);
    }, [selectedDate]);

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        draggingTaskId.current = taskId;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        const taskId = draggingTaskId.current;
        if (taskId === null) return;

        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === status) return;

        await moveTask(taskId, status);
        draggingTaskId.current = null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 font-black text-2xl uppercase">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 border-4 border-black bg-red-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-bold text-lg">
                ⚠️ Error: {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((status) => (
                <Column
                    key={status}
                    status={status}
                    tasks={tasks.filter((t) => t.status === status)}
                    isDragOver={dragOverColumn === status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
}
