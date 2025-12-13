export type OcrResult = {
    rawText: string | null;
    confidence: number | null;
    language?: string | null;
    engine?: string | null;
    raw?: any;
};

export interface IOcrService {
    detectText(buffer: Buffer): Promise<OcrResult>;
}
