import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UserFile } from './entities/user-file.entity';
import { UserFileService } from './user-file.service';
import { UserFileRepository } from './user-file.repository';
import { StorageModule } from '../../common/storage';
import { ProfilesModule } from '../profiles/profiles.module';
import { AccountController } from './account.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserFile]),
        StorageModule,
        forwardRef(() => ProfilesModule),
    ],
    controllers: [UsersController, AccountController],
    providers: [UsersService, UsersRepository, UserFileService, UserFileRepository],
    exports: [UsersService, UsersRepository, UserFileService, UserFileRepository],
})
export class UsersModule {}
