import {
    extractRawTextFromResult,
    extractAverageConfidence,
    extractLanguageFromResult,
} from '../../../src/common/ocr/ocr.util';

describe('OCR Utilities', () => {
    describe('extractRawTextFromResult', () => {
        it('should extract raw text from valid result', () => {
            const result = {
                fullTextAnnotation: {
                    text: 'Extracted business card text',
                },
            };

            const text = extractRawTextFromResult(result as any);

            expect(text).toBe('Extracted business card text');
        });

        it('should return null for empty result', () => {
            const result = {};

            const text = extractRawTextFromResult(result as any);

            expect(text).toBeNull();
        });

        it('should return null when fullTextAnnotation is missing', () => {
            const result = {
                textAnnotations: [],
            };

            const text = extractRawTextFromResult(result as any);

            expect(text).toBeNull();
        });

        it('should handle null fullTextAnnotation', () => {
            const result = {
                fullTextAnnotation: null,
            };

            const text = extractRawTextFromResult(result as any);

            expect(text).toBeNull();
        });
    });

    describe('extractAverageConfidence', () => {
        it('should calculate average confidence from symbols', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            blocks: [
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [
                                                        { confidence: 0.9 },
                                                        { confidence: 0.95 },
                                                        { confidence: 0.85 },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            blocks: [
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [{ confidence: 0.88 }],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            };

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeGreaterThan(0);
            expect(confidence).toBeLessThanOrEqual(1);
            expect(confidence).toBeCloseTo(0.895, 2); // Average of 0.9, 0.95, 0.85, 0.88
        });

        it('should return null for empty result', () => {
            const result = {};

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeNull();
        });

        it('should return null when pages are empty', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [],
                },
            };

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeNull();
        });

        it('should handle missing confidence values', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            blocks: [{ paragraphs: [] }],
                        },
                    ],
                },
            };

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeDefined();
        });

        it('should calculate from symbols in multiple words', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            blocks: [
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [
                                                        { confidence: 0.95 },
                                                        { confidence: 0.9 },
                                                        { confidence: 0.85 },
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
            };

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeCloseTo(0.9, 1);
        });

        it('should calculate average from multiple blocks with symbols', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            blocks: [
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [
                                                        { confidence: 0.92 },
                                                        { confidence: 0.88 },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    paragraphs: [
                                        {
                                            words: [
                                                {
                                                    symbols: [{ confidence: 0.9 }],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            };

            const confidence = extractAverageConfidence(result as any);

            expect(confidence).toBeGreaterThan(0);
            expect(confidence).toBeLessThanOrEqual(1);
            expect(confidence).toBeCloseTo(0.9, 1); // Average of 0.92, 0.88, and 0.90
        });
    });

    describe('extractLanguageFromResult', () => {
        it('should extract language from pages.property.detectedLanguages', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            property: {
                                detectedLanguages: [
                                    {
                                        languageCode: 'en',
                                    },
                                ],
                            },
                        },
                    ],
                },
            };

            const language = extractLanguageFromResult(result as any);

            expect(language).toBe('en');
        });

        it('should return null for empty result', () => {
            const result = {};

            const language = extractLanguageFromResult(result as any);

            expect(language).toBeNull();
        });

        it('should return null when pages are empty', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [],
                },
            };

            const language = extractLanguageFromResult(result as any);

            expect(language).toBeNull();
        });

        it('should return null when property is missing', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            blocks: [],
                        },
                    ],
                },
            };

            const language = extractLanguageFromResult(result as any);

            expect(language).toBeNull();
        });

        it('should handle missing detectedLanguages', () => {
            const result = {
                fullTextAnnotation: {
                    pages: [
                        {
                            property: {},
                        },
                    ],
                },
            };

            const language = extractLanguageFromResult(result as any);

            expect(language).toBeNull();
        });

        it('should recognize various language codes', () => {
            const languages = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar'];

            languages.forEach((languageCode) => {
                const result = {
                    fullTextAnnotation: {
                        pages: [
                            {
                                property: {
                                    detectedLanguages: [
                                        {
                                            languageCode,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                };

                const language = extractLanguageFromResult(result as any);
                expect(language).toBe(languageCode);
            });
        });
    });
});
