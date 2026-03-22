declare module 'exif-parser' {
  interface ExifTags {
    DateTimeOriginal?: number;
    Make?: string;
    Model?: string;
    ExposureTime?: number;
    FNumber?: number;
    ISO?: number;
    FocalLength?: number;
    [key: string]: unknown;
  }

  interface ExifResult {
    tags: ExifTags;
    imageSize?: { width: number; height: number };
  }

  interface ExifParserInstance {
    parse(): ExifResult;
  }

  function create(buffer: Buffer): ExifParserInstance;
  export = { create };
}
