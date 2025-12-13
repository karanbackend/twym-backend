import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { CalendarConnection } from './entities';
import { CalendarConnectionRepository } from './repositories';
import {
    GoogleCalendarProvider,
    MicrosoftCalendarProvider,
    CalendarProviderFactory,
} from './providers';
import { CalendarTokenRefreshScheduler } from '../schedulers';
import { AppConfig } from '../config/app.config';
import { IdempotencyModule } from '../idempotency/idempotency.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CalendarConnection]),
        IdempotencyModule,
        ConfigModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [CalendarController],
    providers: [
        AppConfig,
        CalendarService,
        GoogleCalendarProvider,
        MicrosoftCalendarProvider,
        CalendarProviderFactory,
        CalendarConnectionRepository,
        CalendarTokenRefreshScheduler,
    ],
    exports: [CalendarService],
})
export class CalendarModule {}
