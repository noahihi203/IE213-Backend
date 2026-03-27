import sharp from "sharp";
import { BadRequestError } from "../core/error.response.js";

type ImageOutputFormat = "webp" | "avif";

interface OptimizeImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageOutputFormat;
}

interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  contentType: string;
}

class ImageOptimizerService {
  private static readonly DEFAULT_WIDTH = 1280;
  private static readonly DEFAULT_QUALITY = 78;
  private static readonly MAX_DIMENSION = 3840;

  private static clampNumber(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static async optimize(
    inputBuffer: Buffer,
    options: OptimizeImageOptions,
  ): Promise<OptimizedImageResult> {
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new BadRequestError("Image file is required");
    }

    const width = options.width
      ? ImageOptimizerService.clampNumber(options.width, 64, this.MAX_DIMENSION)
      : this.DEFAULT_WIDTH;

    const height = options.height
      ? ImageOptimizerService.clampNumber(
          options.height,
          64,
          this.MAX_DIMENSION,
        )
      : undefined;

    const quality = options.quality
      ? ImageOptimizerService.clampNumber(options.quality, 35, 95)
      : this.DEFAULT_QUALITY;

    const format: ImageOutputFormat =
      options.format === "avif" ? "avif" : "webp";

    let transformer = sharp(inputBuffer, { failOn: "none" }).rotate().resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (format === "avif") {
      transformer = transformer.avif({ quality, effort: 4 });
    } else {
      transformer = transformer.webp({ quality, effort: 4 });
    }

    const { data, info } = await transformer.toBuffer({
      resolveWithObject: true,
    });

    return {
      buffer: data,
      format: info.format,
      width: info.width,
      height: info.height,
      size: info.size,
      contentType: `image/${info.format}`,
    };
  }
}

export default ImageOptimizerService;
