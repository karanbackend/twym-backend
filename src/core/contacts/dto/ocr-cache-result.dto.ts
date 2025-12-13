/**
 * OCR cache result structure
 */
export class OcrCacheResultDto {
    raw_text: string | null;
    confidence: number | null;
    engine?: string;
    processed_at?: string;
}
