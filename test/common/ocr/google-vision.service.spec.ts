import { GoogleVisionOcrService } from '../../../src/common/ocr/google-vision.service';
import { AppConfig } from '../../../src/common/config/app.config';

// Mock the Google Cloud Vision client
jest.mock('@google-cloud/vision', () => {
    return {
        ImageAnnotatorClient: jest.fn().mockImplementation(() => {
            return {
                documentTextDetection: jest.fn(),
            };
        }),
    };
});

describe('GoogleVisionOcrService', () => {
    let service: GoogleVisionOcrService;
    let mockAppConfig: AppConfig;

    beforeEach(() => {
        // Create a mock AppConfig with googleOcr configuration
        mockAppConfig = {
            googleOcr: {
                enabled: true,
                credentialsB64: Buffer.from(
                    JSON.stringify({
                        client_email: 'test@test.iam.gserviceaccount.com',
                        private_key:
                            '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                        project_id: 'test-project',
                    }),
                ).toString('base64'),
            },
        } as AppConfig;

        service = new GoogleVisionOcrService(mockAppConfig);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('detectText', () => {
        it('should return null values when client not available', async () => {
            const buffer = Buffer.from('test-image');
            const result = await service.detectText(buffer);
            expect(result).toBeDefined();
            expect(result.rawText).toBeNull();
            expect(result.confidence).toBeNull();
        });
        it('should handle OCR errors gracefully', async () => {
            const mockClient = {
                documentTextDetection: jest.fn().mockRejectedValue(new Error('OCR failed')),
            };
            (service as any).client = mockClient;
            const buffer = Buffer.from('test-image');
            const result = await service.detectText(buffer);
            expect(result).toBeDefined();
            expect(result.rawText).toBeNull();
            expect(result.confidence).toBeNull();
        });
        it('should process successful OCR response', async () => {
            const mockOcrResponse = {
                fullTextAnnotation: {
                    text: 'Detected text content',
                    pages: [
                        {
                            property: {
                                detectedLanguages: [{ languageCode: 'en' }],
                            },
                            blocks: [
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [
                                                        { confidence: 0.96 },
                                                        { confidence: 0.95 },
                                                        { confidence: 0.94 },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                textAnnotations: [{ description: 'Detected text content', locale: 'en' }],
            };
            const mockClient = {
                documentTextDetection: jest.fn().mockResolvedValue([mockOcrResponse]),
            };
            (service as any).client = mockClient;
            const buffer = Buffer.from('test-image');
            const result = await service.detectText(buffer);
            expect(result).toBeDefined();
            expect(result.rawText).toBe('Detected text content');
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.language).toBe('en');
            expect(result.engine).toBe('google_vision');
        });
        it('should handle empty OCR response', async () => {
            const mockOcrResponse = {
                fullTextAnnotation: null,
                textAnnotations: [],
            };
            const mockClient = {
                documentTextDetection: jest.fn().mockResolvedValue([mockOcrResponse]),
            };
            (service as any).client = mockClient;
            const buffer = Buffer.from('test-image');
            const result = await service.detectText(buffer);
            expect(result).toBeDefined();
        });
    });
});
