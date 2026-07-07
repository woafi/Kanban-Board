"use client";

import { useState } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import type { Task } from '@/types';
import { useTaskStore } from '@/lib/task-store';
import TaskModal from './TaskModal';

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-green-300 border-green-600',
    medium: 'bg-yellow-300 border-yellow-600',
    high: 'bg-red-300 border-red-600',
};

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: number) => void;
}

export default function TaskCard({ task, onDragStart }: TaskCardProps) {
    const { deleteTask } = useTaskStore();
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete "${task.title}"?`)) return;
        setIsDeleting(true);
        try {
            await deleteTask(task.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 group hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-grab active:cursor-grabbing"
            >
                {/* Drag handle + actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                            className="border-2 border-black p-1 bg-cyan-200 hover:bg-cyan-400 transition-colors"
                            title="Edit task"
                        >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="border-2 border-black p-1 bg-red-200 hover:bg-red-400 transition-colors disabled:opacity-50"
                            title="Delete task"
                        >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <p className="font-black text-base leading-tight mb-2">{task.title}</p>

                {/* Description */}
                {task.description && (
                    <p className="text-sm text-gray-600 font-medium mb-2 line-clamp-2">{task.description}</p>
                )}

                {/* Priority badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`border-2 px-2 py-0.5 text-xs font-black uppercase ${PRIORITY_STYLES[task.priority] ?? 'bg-gray-200 border-gray-400'}`}>
                        {task.priority}
                    </span>

                    {/* Tags */}
                    {task.tags.map((tag) => (
                        <span key={tag.id} className="border-2 border-black px-2 py-0.5 text-xs font-bold bg-pink-100">
                            #{tag.name}
                        </span>
                    ))}
                </div>
            </div>

            {showEditModal && (
                <TaskModal task={task} onClose={() => setShowEditModal(false)} />
            )}
        </>
    );
}
