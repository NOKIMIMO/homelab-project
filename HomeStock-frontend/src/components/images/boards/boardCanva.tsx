import { Layout, Zap } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { Board, BoardAsset } from "@spe_types/board";

interface BoardCanvaProps {
  board: Board;
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  updateAsset: (idx: number, patch: Partial<BoardAsset>) => void;
  removeAsset: (idx: number) => void;
}

const boardCanva: React.FC<BoardCanvaProps> = ({
  board,
  selectedIdx,
  setSelectedIdx,
  updateAsset,
  removeAsset,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isDraggingAsset, setIsDraggingAsset] = useState(false);
    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const zoom = useMemo(() => {
        if (!board || !containerSize.width) return 1;
        const padding = 60;
        const availableW = containerSize.width - padding;
        const availableH = containerSize.height - padding;
        return Math.min(availableW / board.width, availableH / board.height, 1);
    }, [board, containerSize]);
    const [zoomLevel, setZoomLevel] = useState(zoom);   

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
            });
        }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);




    const onMouseDownBoard = (e: React.MouseEvent<HTMLDivElement>) => {
        //e.buttons => buttons 1: left click, 3: right click, 4: middle click
        e.stopPropagation();
        if (e.buttons === 4) {
            setIsDraggingBoard(true);
        }
    }

    const onMouseDown = (e: React.MouseEvent, idx: number) => {
        if (e.buttons !== 1) return; 
        e.stopPropagation();
        setSelectedIdx(idx);
        setIsDraggingAsset(true);

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const asset = board.assets[idx];
        const mouseX = e.clientX - containerRect.left - boardOffset.x;
        const mouseY = e.clientY - containerRect.top - boardOffset.y;

        setDragOffset({
            x: mouseX - asset.x_position * zoomLevel,
            y: mouseY - asset.y_position * zoomLevel,
        });

        const assetElement = document.querySelector(`img[src='${asset.src}']`) as HTMLImageElement;
        console.log("Asset element found:", assetElement);
        // corriger bug avec assets pouvant dépaser les bords du board
        //  faire que leur center ne peux sortir du board
        // pas grave les bords
        
        // if (assetElement && (!asset.width || !asset.height)) {
        //     console.log("Updating asset dimensions for", asset.asset_name);
        //     updateAsset(idx, {
        //         width: assetElement.naturalWidth,
        //         height: assetElement.naturalHeight,
        //     });
        // }
    };

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prevZoom) => Math.min(Math.max(prevZoom + zoomChange, 0.5), 2));
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDraggingBoard) {
            setBoardOffset((prevOffset) => ({
            x: prevOffset.x + e.movementX,
            y: prevOffset.y + e.movementY,
            }));
        } else if (isDraggingAsset && selectedIdx !== null && board) {
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;

            const mouseX = e.clientX - containerRect.left - boardOffset.x;
            const mouseY = e.clientY - containerRect.top - boardOffset.y;

            let newX = (mouseX - dragOffset.x) / zoomLevel;
            let newY = (mouseY - dragOffset.y) / zoomLevel;
            // newX = Math.max(0, Math.min(newX, board.width - (board.assets[selectedIdx].width || 0) ));
            // newY = Math.max(0, Math.min(newY, board.height - (board.assets[selectedIdx].height || 0) ));

            updateAsset(selectedIdx, {
                x_position: newX,
                y_position: newY,
            }); 
        }
    };

    const onMouseUp = () => {
        setIsDraggingAsset(false);
        setIsDraggingBoard(false);
    };

    const onCanvasClick = (e: React.MouseEvent) => {
        if (e.target === containerRef.current) {
        setSelectedIdx(null);
        }
    };

    return (
        <div
        className="flex-1 h-full bg-base-300 relative flex items-center justify-center p-20 pt-24 cursor-default overflow-hidden"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onCanvasClick}
        onWheel={onWheel}
        >
        <div
            ref={containerRef}
            className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] relative transition-transform duration-300 ease-out preserve-3d"
            style={{
            width: `${board.width}px`,
            height: `${board.height}px`,
            transform: `translate(${boardOffset.x}px, ${boardOffset.y}px) scale(${zoomLevel})`,
            backgroundImage: "radial-gradient(#e5e7eb 2px, transparent 0)",
            backgroundSize: "40px 40px",
            }}
            onMouseDown={onMouseDownBoard}
            onMouseUp={onMouseUp}
        >
            {board.assets?.map((asset, i) => (
            <div
                key={`${asset.asset_name}-${i}`}
                className={`absolute cursor-move select-none transition-shadow ${
                selectedIdx === i
                    ? "ring-8 ring-primary z-30 shadow-2xl scale-[1.02]"
                    : "hover:ring-4 ring-primary/30 z-10"
                }`}
                onMouseDown={(e) => onMouseDown(e, i)}
                style={{
                left: `${asset.x_position}px`,
                top: `${asset.y_position}px`,
                transform: `rotate(${asset.rotation}deg) scale(${asset.scale})`,
                transformOrigin: "center center",
                width: "fit-content",
                }}
            >
                <img
                src={asset.src}
                draggable={false}
                className="max-w-100 h-auto shadow-2xl block"
                alt=""
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/400x400?text=Image+Introuvable";
                }}
                />
            </div>
            ))}
        </div>

        {/* Visual Cues */}
        <div className="absolute bottom-10 right-10 bg-base-100/40 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-6 shadow-2xl z-50">
            <div className="flex items-center gap-3">
            <Layout size={14} className="text-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] opacity-60">ZOOM: {(zoomLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
            <Zap size={14} className="text-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] opacity-60">ASSETS: {board.assets?.length || 0}</span>
            </div>
        </div>
        </div>
    );
};

export default boardCanva;