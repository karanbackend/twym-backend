import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from './app.config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: AppConfig,
            useFactory: (configService: ConfigService) => new AppConfig(configService),
            inject: [ConfigService],
        },
    ],
    exports: [AppConfig],
})
export class AppConfigModule {}
