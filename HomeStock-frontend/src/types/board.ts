
export interface BoardAsset {
  asset_name: string;
  src: string;
  scale: number;
  rotation: number;
  x_position: number;
  y_position: number;
}

export interface Board {
  id: string;
  name: string;
  height: number;
  width: number;
  assets: BoardAsset[];
}