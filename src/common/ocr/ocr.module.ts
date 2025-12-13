import { Module } from '@nestjs/common';
import { GoogleVisionOcrService } from './google-vision.service';
import { AppConfigModule } from '../config/app-config.module';
import { OCR_SERVICE } from '.';

@Module({
    imports: [AppConfigModule],
    providers: [
        {
            provide: OCR_SERVICE,
            useClass: GoogleVisionOcrService,
        },
    ],
    exports: [OCR_SERVICE],
})
export class OcrModule {}
