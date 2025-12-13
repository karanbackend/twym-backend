import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ContactForm } from './entities/contact-form.entity';

@Injectable()
export class ContactFormRepository {
    constructor(
        @InjectRepository(ContactForm)
        private readonly repo: Repository<ContactForm>,
    ) {}

    create(data: DeepPartial<ContactForm>): ContactForm {
        return this.repo.create(data) as unknown as ContactForm;
    }

    save(entity: ContactForm | DeepPartial<ContactForm>): Promise<ContactForm> {
        return this.repo.save(entity as any) as Promise<ContactForm>;
    }

    findAll(): Promise<ContactForm[]> {
        return this.repo.find({
            order: { createdAt: 'DESC' },
        });
    }

    findOneById(id: string): Promise<ContactForm | null> {
        return this.repo.findOne({
            where: { id },
        });
    }

    findOneByProfileId(profileId: string): Promise<ContactForm | null> {
        return this.repo.findOne({
            where: { profileId },
        });
    }

    async remove(entity: ContactForm): Promise<void> {
        await this.repo.remove(entity);
    }
}
