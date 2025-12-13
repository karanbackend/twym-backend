import { GoogleVisionOcrService } from './google-vision.service';
import type { IOcrService, OcrResult } from './ocr.interface';

export const OCR_SERVICE = Symbol('OCR_SERVICE');
export type { IOcrService, OcrResult };
export { GoogleVisionOcrService };
