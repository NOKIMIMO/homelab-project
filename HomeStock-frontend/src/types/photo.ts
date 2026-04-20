export interface PhotoMetadata {
  stats: any;
  exif?: any;
}

export interface Photo {
  name: string;
  url: string;
  date: number;
  uploadDate: number;
  metadata: PhotoMetadata;
}
