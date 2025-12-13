import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';

const DELETION_GRACE_DAYS = 30; // 30-day grace period

@Injectable()
export class UsersService {
    constructor(private usersRepo: UsersRepository) {}
    async findAll(): Promise<User[]> {
        return this.usersRepo.findAll();
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepo.findById(id);
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        return this.usersRepo.update(id, updateUserDto as Partial<User>);
    }

    async remove(id: string): Promise<void> {
        return this.usersRepo.delete(id);
    }

    /**
     * Ensure a user record exists for the given id. If not present, create a minimal user record.
     * Handles potential race conditions by re-checking after a create error.
     */
    async ensureUserExists(id: string): Promise<User> {
        const existing = await this.usersRepo.findById(id);
        if (existing) return existing;

        try {
            return await this.usersRepo.create({
                id,
                createdAt: new Date(),
            });
        } catch (err: unknown) {
            // possible race condition or DB error: re-check
            const nowExists = await this.usersRepo.findById(id);
            if (nowExists) return nowExists;
            if (err instanceof Error) throw err;
            throw new UnauthorizedException(String(err));
        }
    }

    // Request account deletion: lock account immediately and schedule hard deletion after grace period
    async requestAccountDeletion(id: string): Promise<User> {
        const scheduledFor = new Date();
        scheduledFor.setUTCDate(scheduledFor.getUTCDate() + DELETION_GRACE_DAYS);
        return this.usersRepo.scheduleDeletion(id, scheduledFor);
    }

    // Cancel an existing scheduled deletion
    async cancelAccountDeletion(id: string): Promise<User> {
        return this.usersRepo.cancelDeletion(id);
    }
}
