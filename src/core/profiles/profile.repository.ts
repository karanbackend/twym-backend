import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileRepository {
    constructor(
        @InjectRepository(Profile)
        private readonly repo: Repository<Profile>,
    ) {}

    create(data: DeepPartial<Profile>): Profile {
        return this.repo.create(data) as unknown as Profile;
    }

    save(entity: Profile | DeepPartial<Profile>): Promise<Profile> {
        return this.repo.save(entity as any) as Promise<Profile>;
    }

    findAll(): Promise<Profile[]> {
        return this.repo.find({
            relations: ['user', 'phoneNumbers', 'emails', 'addresses', 'links'],
        });
    }

    findOneById(id: string): Promise<Profile | null> {
        return this.repo.findOne({
            where: { id },
            relations: ['user', 'phoneNumbers', 'emails', 'addresses', 'links'],
        });
    }

    findOneByUserId(userId: string): Promise<Profile | null> {
        return this.repo.findOne({
            where: { userId },
            relations: ['user', 'phoneNumbers', 'emails', 'addresses', 'links'],
        });
    }

    findOneByDeeplinkSlug(slug: string): Promise<Profile | null> {
        return this.repo.findOne({
            where: { deeplinkSlug: slug },
            relations: ['user', 'phoneNumbers', 'emails', 'addresses', 'links'],
        });
    }

    findOneByProfileHandle(handle: string): Promise<Profile | null> {
        return this.repo.findOne({
            where: { profileHandle: handle },
            relations: ['user', 'phoneNumbers', 'emails', 'addresses', 'links'],
        });
    }

    remove(entity: Profile): Promise<Profile> {
        return this.repo.remove(entity);
    }
}
