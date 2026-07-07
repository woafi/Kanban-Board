export interface LoginCredentials {
    email: string;
    password: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
}

export interface AuthResponse {
    message: string;
    success: boolean;
    user: User;
}

export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Tag {
    id: number;
    name: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string; // YYYY-MM-DD
    tags: Tag[];
    order: number;
    created_at: string;
    updated_at: string;
}

// ── Annotation Types ─────────────────────────────────────────────────────────

export interface Point {
    x: number; // normalized 0.0 – 1.0
    y: number;
}

export interface Polygon {
    id: number;
    image_id: number;
    points: Point[];
    created_at: string;
}

export interface AnnotationImage {
    id: number;
    filename: string;
    url: string;
    polygon_count: number;
    uploaded_at: string;
}