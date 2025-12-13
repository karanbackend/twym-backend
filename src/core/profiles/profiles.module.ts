import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { ProfileRepository } from './profile.repository';
import { ProfilePhoneNumber } from './entities/profile-phone-number.entity';
import { ProfileEmail } from './entities/profile-email.entity';
import { ProfileAddress } from './entities/profile-address.entity';
import { ProfileLink } from './entities/profile-link.entity';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../../common/auth/supabase/supabase.module';
import { VCardService } from './vcard.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Profile,
            User,
            ProfilePhoneNumber,
            ProfileEmail,
            ProfileAddress,
            ProfileLink,
        ]),
        forwardRef(() => UsersModule),
        SupabaseModule,
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService, ProfileRepository, VCardService],
    exports: [ProfilesService],
})
export class ProfilesModule {}
