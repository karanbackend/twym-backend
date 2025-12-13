import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactFormsService } from './contact-forms.service';
import { ContactFormsController } from './contact-forms.controller';
import { ContactForm } from './entities/contact-form.entity';
import { ContactSubmission } from './entities/contact-submission.entity';
import { ContactFormRepository } from './contact-form.repository';
import { ContactSubmissionRepository } from './contact-submission.repository';
import { ProfilesModule } from '../profiles/profiles.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ContactForm, ContactSubmission]),
        ScheduleModule.forRoot(),
        ProfilesModule,
        forwardRef(() => ContactsModule),
    ],
    controllers: [ContactFormsController],
    providers: [ContactFormsService, ContactFormRepository, ContactSubmissionRepository],
    exports: [ContactFormsService, ContactSubmissionRepository],
})
export class ContactFormsModule {}
