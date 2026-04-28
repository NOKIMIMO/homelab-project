
interface boardPhotoTransformerProps {
    selectedAsset: any; // à typer
    selectedIdx: number | null;
    updateAsset: (idx: number, newProps: Partial<any>) => void; // à typer
    removeAsset: (idx: number) => void;
    board: any; // à typer
}

const boardPhotoTransformer = () => {

    return (
        <div className="space-y-10 py-4">
              {selectedAsset ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-base-300 aspect-video shadow-inner">
                      <img src={selectedAsset.src} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          className="btn btn-circle btn-error shadow-2xl scale-75 group-hover:scale-100 transition-transform"
                          onClick={() => removeAsset(selectedIdx!)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2 pr-2">
                             <Move size={12} /> Position
                          </label>
                          <span className="text-[10px] font-mono opacity-50 bg-base-300 px-2 py-1 rounded-md">{Math.round(selectedAsset.x_position)}, {Math.round(selectedAsset.y_position)}</span>
                        </div>
                        <div className="space-y-6 bg-base-200/50 p-4 rounded-2xl border border-white/5">
                          <input type="range" min="0" max={board.width} step="1" value={selectedAsset.x_position} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { x_position: Number(e.target.value) })} />
                          <input type="range" min="0" max={board.height} step="1" value={selectedAsset.y_position} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { y_position: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                             <Maximize size={12} /> Échelle
                          </label>
                          <span className="text-[10px] font-mono opacity-50">{selectedAsset.scale.toFixed(2)}x</span>
                        </div>
                        <input type="range" min="0.1" max="5.0" step="0.05" value={selectedAsset.scale} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { scale: Number(e.target.value) })} />
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                             <RotateCw size={12} /> Rotation
                          </label>
                          <span className="text-[10px] font-mono opacity-50">{selectedAsset.rotation}°</span>
                        </div>
                        <input type="range" min="0" max="360" step="1" value={selectedAsset.rotation} className="range range-xs range-primary" onChange={(e) => updateAsset(selectedIdx!, { rotation: Number(e.target.value) })} />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-base-200/30 rounded-[40px] border-2 border-dashed border-white/5 px-6">
                   <div className="w-16 h-16 bg-base-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl"><MousePointer2 size={32} className="opacity-20 translate-x-1" /></div>
                   <p className="text-center text-xs font-bold leading-relaxed opacity-30 uppercase tracking-widest">
                     Sélectionnez une photo pour l'éditer
                   </p>
                </div>
              )}
            </div>
    )
}

export default boardPhotoTransformer;