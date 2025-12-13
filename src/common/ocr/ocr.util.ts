import { protos } from '@google-cloud/vision';

export function extractRawTextFromResult(
    result: protos.google.cloud.vision.v1.IAnnotateImageResponse,
): string | null {
    return result.fullTextAnnotation?.text ?? null;
}

export function extractAverageConfidence(
    result: protos.google.cloud.vision.v1.IAnnotateImageResponse,
): number | null {
    const annotation = result.fullTextAnnotation;
    if (!annotation?.pages) return null;

    let sum = 0;
    let count = 0;

    annotation.pages.forEach((page) => {
        page.blocks?.forEach((block) => {
            block.paragraphs?.forEach((paragraph) => {
                paragraph.words?.forEach((word) => {
                    word.symbols?.forEach((symbol) => {
                        if (symbol.confidence != null) {
                            sum += symbol.confidence;
                            count++;
                        }
                    });
                });
            });
        });
    });

    if (count === 0) return null;
    return sum / count;
}

export function extractLanguageFromResult(
    result: protos.google.cloud.vision.v1.IAnnotateImageResponse,
): string | null {
    return (
        result.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode ??
        null
    );
}
