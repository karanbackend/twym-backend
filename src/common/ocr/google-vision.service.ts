import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import type { IOcrService, OcrResult } from './ocr.interface';
import { AppConfig } from '../config/app.config';
import {
    extractAverageConfidence,
    extractLanguageFromResult,
    extractRawTextFromResult,
} from './ocr.util';

@Injectable()
export class GoogleVisionOcrService implements IOcrService, OnModuleInit {
    private readonly logger = new Logger(GoogleVisionOcrService.name);
    private readonly client: ImageAnnotatorClient;

    constructor(private readonly appConfig: AppConfig) {
        this.client = this.createClient();
        this.logger.log('GoogleVisionOcrService initialized');
    }

    /**
     * Creates the Google Vision client.
     * Supports:
     *  - GOOGLE_CREDENTIALS_JSON (inline JSON) → recommended for Azure App Service
     *  - GOOGLE_APPLICATION_CREDENTIALS (file path)
     *  - ADC fallback (local dev)
     */
    private createClient(): ImageAnnotatorClient {
        const config = this.appConfig.googleOcr;
        const credentialsB64 = config.credentialsB64;

        if (!credentialsB64) {
            this.logger.error('GOOGLE_CREDENTIALS_B64 is missing. OCR will not work.');
            throw new HttpException(
                'Missing GOOGLE_CREDENTIALS_B64 environment variable for Google Vision.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const jsonStr = Buffer.from(credentialsB64, 'base64').toString('utf8');
            const parsed = JSON.parse(jsonStr) as {
                client_email: string;
                private_key: string;
                project_id: string;
            };

            if (parsed.private_key?.includes('\\n')) {
                const privateKeyWithNewlines = parsed.private_key.replace(/\\n/g, '\n');
                parsed.private_key = privateKeyWithNewlines;
            }

            this.logger.log('GoogleVisionOcrService: using Base64 credentials');

            const clientEmail: string = parsed.client_email;
            const privateKey: string = parsed.private_key;
            const projectId: string = parsed.project_id;

            return new ImageAnnotatorClient({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                projectId: projectId,
            });
        } catch (err) {
            this.logger.error('Failed to decode GOOGLE_CREDENTIALS_B64', err);
            throw err;
        }
    }

    async detectText(buffer: Buffer): Promise<OcrResult> {
        try {
            const [result] = await this.client.documentTextDetection({
                image: { content: buffer },
            });

            const rawText = extractRawTextFromResult(result);
            const confidence = extractAverageConfidence(result);
            const language = extractLanguageFromResult(result);

            return {
                rawText,
                confidence,
                language,
                engine: 'google_vision',
                raw: result,
            };
        } catch (err) {
            const e = err as Error;

            if (e.message.includes('Could not load the default credentials')) {
                this.logger.error(
                    'GoogleVisionOcrService: Missing Google credentials. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file path.',
                );
            }

            this.logger.error('GoogleVisionOcrService.detectText error', e);

            return {
                rawText: null,
                confidence: null,
                language: null,
                engine: 'google_vision',
            };
        }
    }

    /**
     * Called automatically when the module is initialized.
     * This verifies Google Vision is reachable & credentials are valid.
     */
    async onModuleInit() {
        this.logger.log('GoogleVisionOcrService: Performing Google Vision startup check…');

        try {
            // Small no-op request to validate credentials
            await this.client.getProjectId();

            this.logger.log('GoogleVisionOcrService: Google Vision loaded successfully');
        } catch (err) {
            this.logger.error('GoogleVisionOcrService: FAILED to initialize Google Vision ❌');
            this.logger.error(err);
        }
    }
}
