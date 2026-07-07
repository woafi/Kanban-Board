"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const COLUMN_STYLES: Record<TaskStatus, { header: string; bg: string; empty: string }> = {
    todo: {
        header: 'bg-pink-300',
        bg: 'bg-white',
        empty: 'bg-pink-50',
    },
    inprogress: {
        header: 'bg-cyan-300',
        bg: 'bg-white',
        empty: 'bg-cyan-50',
    },
    done: {
        header: 'bg-green-300',
        bg: 'bg-white',
        empty: 'bg-green-50',
    },
};

const COLUMN_LABELS: Record<TaskStatus, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done',
};

interface ColumnProps {
    status: TaskStatus;
    tasks: Task[];
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, status: TaskStatus) => void;
    onDragStart: (e: React.DragEvent, taskId: number) => void;
}

export default function Column({
    status,
    tasks,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragStart,
}: ColumnProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const styles = COLUMN_STYLES[status];

    return (
        <>
            <div
                className={`flex flex-col border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all
                    ${isDragOver ? 'scale-[1.02] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : ''}
                    ${styles.bg}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, status)}
            >
                {/* Column Header */}
                <div className={`${styles.header} border-b-4 border-black p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black uppercase tracking-tight">{COLUMN_LABELS[status]}</h2>
                        <span className="border-2 border-black bg-white px-2 py-0.5 text-sm font-black">
                            {tasks.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        title={`Add task to ${COLUMN_LABELS[status]}`}
                        className="border-4 border-black bg-white p-1.5 hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                        <Plus className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>

                {/* Task list / drop zone */}
                <div
                    className={`flex-1 p-4 space-y-3 min-h-[200px]
                        ${isDragOver ? `border-4 border-dashed border-black ${styles.empty}` : ''}`}
                >
                    {tasks.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center h-32 border-4 border-dashed border-black ${styles.empty} text-center p-4`}>
                            <p className="font-bold text-gray-500 text-sm uppercase">No tasks</p>
                            <p className="text-xs text-gray-400 mt-1">Drop here or click + to add</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
                        ))
                    )}
                </div>
            </div>

            {showAddModal && (
                <TaskModal defaultStatus={status} onClose={() => setShowAddModal(false)} />
            )}
        </>
    );
}
