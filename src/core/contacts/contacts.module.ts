import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsCleanupService } from './contacts-cleanup.service';
import { Contact } from './entities/contact.entity';
import { ContactPhoneNumber } from './entities/contact-phone-number.entity';
import { ContactEmail } from './entities/contact-email.entity';
import { ContactAddress } from './entities/contact-address.entity';
import { ContactLink } from './entities/contact-link.entity';
import { ContactFile } from './entities/contact-file.entity';
import { ContactRepository } from './contact.repository';
import { ContactFileRepository } from './contact-file.repository';
import { UsersModule } from '../users/users.module';
import { ContactFormsModule } from '../contact-forms/contact-forms.module';
import { StorageModule } from '../../common/storage';
import { OcrModule } from '../../common/ocr/ocr.module';
import { AppConfigModule } from '../../common/config/app-config.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Contact,
            ContactPhoneNumber,
            ContactEmail,
            ContactAddress,
            ContactLink,
            ContactFile,
        ]),
        ScheduleModule.forRoot(),
        forwardRef(() => UsersModule),
        forwardRef(() => ContactFormsModule),
        StorageModule,
        OcrModule,
        AppConfigModule,
    ],
    controllers: [ContactsController],
    providers: [ContactsService, ContactsCleanupService, ContactRepository, ContactFileRepository],
    exports: [ContactsService],
})
export class ContactsModule {}
