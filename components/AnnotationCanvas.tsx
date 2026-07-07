"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2, MousePointer, Hexagon, X } from 'lucide-react';
import type { Point, Polygon } from '@/types';
import { useAnnotationStore } from '@/lib/annotation-store';

// Vibrant cycling palette for polygons (neo-brutalism)
const POLYGON_COLORS = [
    '#06b6d4', // cyan
    '#f472b6', // pink
    '#4ade80', // green
    '#fb923c', // orange
    '#a78bfa', // purple
    '#facc15', // yellow
    '#f87171', // red
    '#34d399', // emerald
];

const SNAP_RADIUS_PX = 14; // pixels to snap to first point

interface AnnotationCanvasProps {
    imageId: number;
    imageUrl: string;
    imageFilename: string;
}

type Mode = 'view' | 'draw';

export default function AnnotationCanvas({ imageId, imageUrl, imageFilename }: AnnotationCanvasProps) {
    const { polygons, fetchPolygons, addPolygon, deletePolygon, isLoadingPolygons } = useAnnotationStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [mode, setMode] = useState<Mode>('view');
    const [draftPoints, setDraftPoints] = useState<Point[]>([]); // in-progress polygon points (normalized)
    const [cursorNorm, setCursorNorm] = useState<Point | null>(null); // current cursor position (normalized)
    const [hoveredPolygonId, setHoveredPolygonId] = useState<number | null>(null);
    const [imgRect, setImgRect] = useState<DOMRect | null>(null);

    const currentPolygons: Polygon[] = polygons[imageId] ?? [];

    // Fetch polygons if not already loaded
    useEffect(() => {
        if (!polygons[imageId]) {
            fetchPolygons(imageId);
        }
    }, [imageId]);

    // Track image layout for coordinate mapping
    useEffect(() => {
        const updateRect = () => {
            if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect());
        };
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [imageUrl]);

    // ESC to cancel drawing
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDraftPoints([]);
                setMode('view');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Convert page coordinates to normalized (0–1) coordinates
    const toNorm = useCallback((pageX: number, pageY: number): Point | null => {
        if (!imgRef.current) return null;
        const rect = imgRef.current.getBoundingClientRect();
        const x = (pageX - rect.left) / rect.width;
        const y = (pageY - rect.top) / rect.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return null;
        return { x, y };
    }, []);

    // Convert normalized coords to SVG pixel coords
    const toSvgPx = (p: Point, w: number, h: number) => ({
        x: p.x * w,
        y: p.y * h,
    });

    const isNearFirstPoint = useCallback((pt: Point): boolean => {
        if (draftPoints.length < 2 || !imgRef.current) return false;
        const rect = imgRef.current.getBoundingClientRect();
        const first = draftPoints[0];
        const dx = (pt.x - first.x) * rect.width;
        const dy = (pt.y - first.y) * rect.height;
        return Math.sqrt(dx * dx + dy * dy) < SNAP_RADIUS_PX;
    }, [draftPoints]);

    const handleSvgMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const norm = toNorm(e.clientX, e.clientY);
        setCursorNorm(norm);
    };

    const handleSvgClick = async (e: React.MouseEvent<SVGElement>) => {
        if (mode !== 'draw') return;
        const norm = toNorm(e.clientX, e.clientY);
        if (!norm) return;

        // Close polygon if clicking near first point
        if (isNearFirstPoint(norm) && draftPoints.length >= 3) {
            await addPolygon(imageId, draftPoints);
            setDraftPoints([]);
            return;
        }

        setDraftPoints((prev) => [...prev, norm]);
    };

    const handleEnterDraw = () => {
        setMode('draw');
        setDraftPoints([]);
        setHoveredPolygonId(null);
    };

    const handleCancelDraw = () => {
        setMode('view');
        setDraftPoints([]);
    };

    const handleDeletePolygon = async (e: React.MouseEvent, polygonId: number) => {
        e.stopPropagation();
        await deletePolygon(imageId, polygonId);
        if (hoveredPolygonId === polygonId) setHoveredPolygonId(null);
    };

    // Compute SVG dimensions from rendered image
    const svgWidth = imgRect?.width ?? 0;
    const svgHeight = imgRect?.height ?? 0;

    const snapActive = draftPoints.length >= 2 && cursorNorm !== null && isNearFirstPoint(cursorNorm);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="font-black text-lg uppercase tracking-tight truncate max-w-xs" title={imageFilename}>
                    {imageFilename}
                </span>
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setMode('view')}
                        disabled={mode === 'view'}
                        className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase text-sm transition-all
                            ${mode === 'view'
                                ? 'bg-black text-white shadow-none'
                                : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                            }`}
                    >
                        <MousePointer className="w-4 h-4" strokeWidth={2.5} />
                        Select
                    </button>
                    <button
                        onClick={handleEnterDraw}
                        disabled={mode === 'draw'}
                        className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase text-sm transition-all
                            ${mode === 'draw'
                                ? 'bg-cyan-400 shadow-none'
                                : 'bg-cyan-300 hover:bg-cyan-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                            }`}
                    >
                        <Hexagon className="w-4 h-4" strokeWidth={2.5} />
                        Draw Polygon
                    </button>
                    {mode === 'draw' && draftPoints.length > 0 && (
                        <button
                            onClick={handleCancelDraw}
                            className="flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase text-sm bg-red-300 hover:bg-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Draw hint */}
            {mode === 'draw' && (
                <div className="mb-2 px-4 py-2 bg-cyan-100 border-4 border-black font-bold text-sm">
                    {draftPoints.length === 0
                        ? '🖊️ Click to place the first point'
                        : draftPoints.length < 3
                            ? `🖊️ ${draftPoints.length} point${draftPoints.length > 1 ? 's' : ''} placed — keep clicking`
                            : snapActive
                                ? '✅ Click to CLOSE the polygon'
                                : `🖊️ ${draftPoints.length} points — click near the first ● to close · ESC to cancel`}
                </div>
            )}

            {/* Canvas area */}
            <div
                ref={containerRef}
                className="relative flex-1 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-gray-900 overflow-hidden flex items-center justify-center"
                style={{ minHeight: 400 }}
            >
                {/* The image */}
                <img
                    ref={imgRef}
                    src={imageUrl}
                    alt={imageFilename}
                    onLoad={() => {
                        if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect());
                    }}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                />

                {/* SVG overlay — absolutely covers exactly the image bounds */}
                {imgRect && svgWidth > 0 && (
                    <svg
                        width={svgWidth}
                        height={svgHeight}
                        style={{
                            position: 'absolute',
                            left: imgRef.current ? imgRef.current.getBoundingClientRect().left - containerRef.current!.getBoundingClientRect().left : 0,
                            top: imgRef.current ? imgRef.current.getBoundingClientRect().top - containerRef.current!.getBoundingClientRect().top : 0,
                            cursor: mode === 'draw' ? 'crosshair' : 'default',
                            pointerEvents: 'all',
                        }}
                        onMouseMove={handleSvgMouseMove}
                        onMouseLeave={() => setCursorNorm(null)}
                        onClick={handleSvgClick}
                    >
                        {/* Saved polygons */}
                        {currentPolygons.map((poly, idx) => {
                            const color = POLYGON_COLORS[idx % POLYGON_COLORS.length];
                            const pts = poly.points.map((p) => toSvgPx(p, svgWidth, svgHeight));
                            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
                            const isHovered = hoveredPolygonId === poly.id && mode === 'view';

                            // Compute centroid for delete button placement
                            const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                            const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

                            return (
                                <g
                                    key={poly.id}
                                    onMouseEnter={() => mode === 'view' && setHoveredPolygonId(poly.id)}
                                    onMouseLeave={() => setHoveredPolygonId(null)}
                                >
                                    <polygon
                                        points={pointsStr}
                                        fill={color}
                                        fillOpacity={isHovered ? 0.45 : 0.25}
                                        stroke={color}
                                        strokeWidth={isHovered ? 3 : 2}
                                        strokeLinejoin="round"
                                    />
                                    {/* Vertex dots */}
                                    {pts.map((p, i) => (
                                        <circle key={i} cx={p.x} cy={p.y} r={isHovered ? 5 : 3} fill={color} stroke="#000" strokeWidth={1.5} />
                                    ))}
                                    {/* Delete button at centroid when hovered */}
                                    {isHovered && (
                                        <foreignObject x={cx - 14} y={cy - 14} width={28} height={28}>
                                            <button
                                                onClick={(e) => handleDeletePolygon(e, poly.id)}
                                                className="w-7 h-7 bg-red-500 border-2 border-black flex items-center justify-center hover:bg-red-700 transition-colors"
                                                title="Delete polygon"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                                            </button>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}

                        {/* Draft polygon (in-progress) */}
                        {mode === 'draw' && draftPoints.length > 0 && (() => {
                            const pts = draftPoints.map((p) => toSvgPx(p, svgWidth, svgHeight));
                            const ghostPt = cursorNorm ? toSvgPx(cursorNorm, svgWidth, svgHeight) : null;
                            const allPts = ghostPt ? [...pts, ghostPt] : pts;
                            const pointsStr = allPts.map((p) => `${p.x},${p.y}`).join(' ');

                            return (
                                <g>
                                    {/* Ghost polygon fill */}
                                    {allPts.length >= 3 && (
                                        <polygon points={pointsStr} fill="#fff" fillOpacity={0.1} stroke="none" />
                                    )}
                                    {/* Ghost edge lines */}
                                    <polyline
                                        points={pointsStr}
                                        fill="none"
                                        stroke="#000"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        strokeLinejoin="round"
                                    />
                                    {/* First point — snap target */}
                                    <circle
                                        cx={pts[0].x}
                                        cy={pts[0].y}
                                        r={snapActive ? SNAP_RADIUS_PX : 6}
                                        fill={snapActive ? '#4ade80' : '#facc15'}
                                        stroke="#000"
                                        strokeWidth={2}
                                        style={{ transition: 'r 0.1s ease' }}
                                    />
                                    {/* Other placed points */}
                                    {pts.slice(1).map((p, i) => (
                                        <circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#000" strokeWidth={2} />
                                    ))}
                                </g>
                            );
                        })()}

                        {/* Loading overlay */}
                        {isLoadingPolygons && (
                            <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="rgba(0,0,0,0.3)" />
                        )}
                    </svg>
                )}
            </div>

            {/* Stats bar */}
            <div className="mt-2 flex gap-4 text-sm font-bold">
                <span>{currentPolygons.length} polygon{currentPolygons.length !== 1 ? 's' : ''}</span>
                {mode === 'draw' && <span className="text-cyan-700">{draftPoints.length} points placed</span>}
            </div>
        </div>
    );
}
