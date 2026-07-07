"use client";

import { useRef } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { useAnnotationStore } from '@/lib/annotation-store';

export default function ImageUploader() {
    const { uploadImage } = useAnnotationStore();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;
            await uploadImage(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-4 border-dashed border-black bg-yellow-100 hover:bg-yellow-200 transition-colors p-6 flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
            <div className="border-4 border-black bg-white p-3 group-hover:bg-black group-hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ImagePlus className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div className="text-center">
                <p className="font-black text-lg uppercase">Drop images here</p>
                <p className="font-bold text-sm text-black/60">or click to browse</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
        </div>
    );
}
