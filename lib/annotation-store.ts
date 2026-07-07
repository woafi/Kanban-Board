import { create } from 'zustand';
import axios from '@/api/axios';
import type { AnnotationImage, Polygon, Point } from '@/types';

interface AnnotationStore {
    images: AnnotationImage[];
    selectedImageIndex: number;
    polygons: Record<number, Polygon[]>; // keyed by imageId
    isLoadingImages: boolean;
    isLoadingPolygons: boolean;

    // Image actions
    fetchImages: () => Promise<void>;
    uploadImage: (file: File) => Promise<void>;
    deleteImage: (id: number) => Promise<void>;
    setSelectedIndex: (index: number) => void;

    // Polygon actions
    fetchPolygons: (imageId: number) => Promise<void>;
    addPolygon: (imageId: number, points: Point[]) => Promise<Polygon>;
    deletePolygon: (imageId: number, polygonId: number) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
    images: [],
    selectedImageIndex: 0,
    polygons: {},
    isLoadingImages: false,
    isLoadingPolygons: false,

    fetchImages: async () => {
        set({ isLoadingImages: true });
        try {
            const res = await axios.get<{ images: AnnotationImage[] }>('/api/images/');
            set({ images: res.data.images, isLoadingImages: false });
        } catch {
            set({ isLoadingImages: false });
        }
    },

    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post<{ image: AnnotationImage }>('/api/images/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newImage = res.data.image;
        set((state) => ({
            images: [...state.images, newImage],
            selectedImageIndex: state.images.length, // select newly uploaded
        }));
    },

    deleteImage: async (id: number) => {
        await axios.delete(`/api/images/${id}/`);
        set((state) => {
            const newImages = state.images.filter((img) => img.id !== id);
            const newPolygons = { ...state.polygons };
            delete newPolygons[id];
            const newIndex = Math.min(state.selectedImageIndex, Math.max(0, newImages.length - 1));
            return { images: newImages, polygons: newPolygons, selectedImageIndex: newIndex };
        });
    },

    setSelectedIndex: (index: number) => {
        set({ selectedImageIndex: index });
        const images = get().images;
        if (images[index]) {
            const imageId = images[index].id;
            if (!get().polygons[imageId]) {
                get().fetchPolygons(imageId);
            }
        }
    },

    fetchPolygons: async (imageId: number) => {
        set({ isLoadingPolygons: true });
        try {
            const res = await axios.get<{ polygons: Polygon[] }>(`/api/images/${imageId}/polygons/`);
            set((state) => ({
                polygons: { ...state.polygons, [imageId]: res.data.polygons },
                isLoadingPolygons: false,
            }));
        } catch {
            set({ isLoadingPolygons: false });
        }
    },

    addPolygon: async (imageId: number, points: Point[]): Promise<Polygon> => {
        const res = await axios.post<{ polygon: Polygon }>(`/api/images/${imageId}/polygons/`, { points });
        const newPolygon = res.data.polygon;
        set((state) => ({
            polygons: {
                ...state.polygons,
                [imageId]: [...(state.polygons[imageId] ?? []), newPolygon],
            },
            // Update polygon count on the image
            images: state.images.map((img) =>
                img.id === imageId ? { ...img, polygon_count: img.polygon_count + 1 } : img
            ),
        }));
        return newPolygon;
    },

    deletePolygon: async (imageId: number, polygonId: number): Promise<void> => {
        await axios.delete(`/api/polygons/${polygonId}/`);
        set((state) => ({
            polygons: {
                ...state.polygons,
                [imageId]: (state.polygons[imageId] ?? []).filter((p) => p.id !== polygonId),
            },
            images: state.images.map((img) =>
                img.id === imageId ? { ...img, polygon_count: Math.max(0, img.polygon_count - 1) } : img
            ),
        }));
    },
}));
