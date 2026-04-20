const styles = {
  navShell: 'flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-base-100/50 p-6 md:p-8 rounded-[40px] backdrop-blur-2xl border border-white/5 shadow-2xl relative overflow-hidden group',
  navGlow: 'absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000',
  viewToggle: 'text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all',
  viewTogglePassive: 'opacity-40 hover:opacity-100',
  sortButton: 'btn btn-xs md:btn-sm join-item rounded-full border-none px-6',
  sortButtonActive: 'btn-primary shadow-lg shadow-primary/20',
  sortButtonPassive: 'btn-ghost opacity-50 font-bold',
  modalCard: 'bg-base-100/50 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden',
  modalLabel: 'text-[10px] uppercase font-black tracking-[0.2em] mb-6',
  modalMetaLabel: 'opacity-40 flex items-center gap-3',
  modalRow: 'flex justify-between items-center',
  circleGhostButton: 'btn btn-circle btn-lg btn-ghost bg-white/10 text-white'
};

export default styles;