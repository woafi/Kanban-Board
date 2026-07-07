"use client";

import { useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { useAnnotationStore } from '@/lib/annotation-store';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';
import AnnotationCanvas from './AnnotationCanvas';

export default function AnnotationWorkspace() {
    const { images, selectedImageIndex, fetchImages, isLoadingImages } = useAnnotationStore();

    useEffect(() => {
        fetchImages();
    }, []);

    const selectedImage = images[selectedImageIndex] ?? null;

    return (
        <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">
            {/* Left sidebar: upload + gallery */}
            <div className="w-48 flex-shrink-0 flex flex-col gap-3">
                <ImageUploader />
                <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2">
                    <h3 className="font-black text-sm uppercase mb-2 border-b-2 border-black pb-1">
                        Images ({images.length})
                    </h3>
                    {isLoadingImages ? (
                        <p className="text-xs font-bold text-black/50">Loading...</p>
                    ) : (
                        <ImageGallery />
                    )}
                </div>
            </div>

            {/* Main canvas area */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedImage ? (
                    <AnnotationCanvas
                        key={selectedImage.id}
                        imageId={selectedImage.id}
                        imageUrl={selectedImage.url}
                        imageFilename={selectedImage.filename}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-black bg-white/60 gap-4">
                        <div className="border-4 border-black bg-yellow-200 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <ImageIcon className="w-14 h-14" strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-2xl uppercase">No image selected</p>
                            <p className="font-bold text-black/60 mt-1">
                                Upload images on the left and click one to start annotating
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
