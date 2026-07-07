"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { useTaskStore, type CreateTaskPayload, type UpdateTaskPayload } from '@/lib/task-store';

interface TaskModalProps {
    /** If provided, modal is in edit mode. */
    task?: Task;
    /** Default status for new tasks (set by which column's "+" was clicked). */
    defaultStatus?: TaskStatus;
    onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
];

export default function TaskModal({ task, defaultStatus = 'todo', onClose }: TaskModalProps) {
    const { addTask, updateTask, selectedDate } = useTaskStore();

    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
    const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
    const [dueDate, setDueDate] = useState(task?.due_date ?? selectedDate);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(task?.tags.map((t) => t.name) ?? []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const addTag = () => {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags((prev) => [...prev, trimmed]);
        }
        setTagInput('');
    };

    const removeTag = (name: string) => setTags((prev) => prev.filter((t) => t !== name));

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            if (task) {
                const payload: UpdateTaskPayload = { title, description, priority, status, due_date: dueDate, tags };
                await updateTask(task.id, payload);
            } else {
                const payload: CreateTaskPayload = { title, description, priority, status, due_date: dueDate, tags };
                await addTask(payload);
            }
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b-4 border-black bg-cyan-300">
                    <h2 className="text-2xl font-black uppercase">
                        {task ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button onClick={onClose} className="p-1 border-4 border-black bg-white hover:bg-black hover:text-white transition-colors">
                        <X className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-300 border-4 border-black font-bold text-sm">{error}</div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block font-black text-sm uppercase mb-1" htmlFor="task-title">Title *</label>
                        <input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full border-4 border-black p-3 font-bold text-lg bg-yellow-50 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-black text-sm uppercase mb-1" htmlFor="task-desc">Description</label>
                        <textarea
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Add some details..."
                            className="w-full border-4 border-black p-3 font-bold bg-yellow-50 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow resize-none"
                        />
                    </div>

                    {/* Priority + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-black text-sm uppercase mb-1" htmlFor="task-priority">Priority</label>
                            <select
                                id="task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full border-4 border-black p-3 font-bold bg-yellow-50 focus:outline-none"
                            >
                                {PRIORITY_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-black text-sm uppercase mb-1" htmlFor="task-status">Status</label>
                            <select
                                id="task-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full border-4 border-black p-3 font-bold bg-yellow-50 focus:outline-none"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block font-black text-sm uppercase mb-1" htmlFor="task-due">Due Date</label>
                        <input
                            id="task-due"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full border-4 border-black p-3 font-bold bg-yellow-50 focus:outline-none"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block font-black text-sm uppercase mb-1" htmlFor="task-tags">Tags</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1 bg-pink-200 border-2 border-black px-2 py-0.5 font-bold text-sm">
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="leading-none hover:text-red-600">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                id="task-tags"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Type tag + Enter"
                                className="flex-1 border-4 border-black p-2 font-bold bg-yellow-50 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="border-4 border-black bg-green-300 px-4 font-black hover:bg-green-400 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border-4 border-black py-3 font-black uppercase bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 border-4 border-black py-3 font-black uppercase bg-green-400 hover:bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
