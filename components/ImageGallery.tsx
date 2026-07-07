"use client";

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useAnnotationStore } from '@/lib/annotation-store';

export default function ImageGallery() {
    const { images, selectedImageIndex, setSelectedIndex, deleteImage } = useAnnotationStore();

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 border-4 border-dashed border-black bg-white/50 text-center p-4">
                <p className="font-black text-sm uppercase text-black/50">No images yet</p>
                <p className="text-xs text-black/40 mt-1">Upload images above</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {images.map((img, index) => {
                const isSelected = index === selectedImageIndex;
                return (
                    <div
                        key={img.id}
                        className={`relative group border-4 cursor-pointer transition-all flex-shrink-0
                            ${isSelected
                                ? 'border-black shadow-none translate-x-0.5 translate-y-0.5'
                                : 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5'
                            }`}
                        onClick={() => setSelectedIndex(index)}
                    >
                        {/* Thumbnail */}
                        <div className="relative h-20 w-full overflow-hidden bg-gray-100">
                            <img
                                src={img.url}
                                alt={img.filename}
                                className="w-full h-full object-cover"
                            />
                            {isSelected && (
                                <div className="absolute inset-0 bg-black/20" />
                            )}
                        </div>

                        {/* Info bar */}
                        <div className={`px-2 py-1 flex items-center justify-between ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                            <span className="text-xs font-bold truncate max-w-[100px]" title={img.filename}>
                                {img.filename}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className={`text-xs font-black border-2 px-1 ${isSelected ? 'border-white' : 'border-black'}`}>
                                    {img.polygon_count}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${img.filename}"?`)) deleteImage(img.id);
                                    }}
                                    className={`p-0.5 border-2 transition-colors opacity-0 group-hover:opacity-100
                                        ${isSelected ? 'border-white hover:bg-red-500' : 'border-black hover:bg-red-300'}`}
                                    title="Delete image"
                                >
                                    <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
