import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/env.config';

import { AppConfig } from './common/config/app.config';
import { AppConfigModule } from './common/config/app-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './common/config/database.config';
import { UsersModule } from './core/users/users.module';
import { ProfilesModule } from './core/profiles/profiles.module';
import { SupabaseModule } from './common/auth/supabase/supabase.module';
import { SupabaseAuthGuard } from './common/auth/supabase/supabase-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ContactsModule } from './core/contacts/contacts.module';
import { OcrModule } from './common/ocr/ocr.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ContactFormsModule } from './core/contact-forms/contact-forms.module';
import { CalendarModule } from './common/calendar/calendar.module';

@Module({
    imports: [
        // Load ConfigModule globally and register our env/app config so AppConfig can read `app.*`
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        AppConfigModule,
        // TypeORM configured asynchronously using ConfigService and our factory
        TypeOrmModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (appCfg: AppConfig) => createTypeOrmOptions(appCfg),
        }),
        // Rate limiting configuration
        ThrottlerModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (appCfg: AppConfig) => ({
                throttlers: [
                    {
                        ttl: appCfg.rateLimit.ttl,
                        limit: appCfg.rateLimit.limit,
                    },
                ],
            }),
        }),
        UsersModule,
        ProfilesModule,
        SupabaseModule,
        OcrModule,
        ContactsModule,
        ContactFormsModule,
        CalendarModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: SupabaseAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
