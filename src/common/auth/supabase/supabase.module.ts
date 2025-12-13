import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { SupabaseAuthStrategy } from './supabase-auth.strategy';
import { UsersModule } from '../../../core/users/users.module';

@Module({
    imports: [ConfigModule, PassportModule, forwardRef(() => UsersModule)],
    providers: [SupabaseService, SupabaseAuthStrategy, SupabaseAuthGuard],
    exports: [SupabaseService, SupabaseAuthGuard],
})
export class SupabaseModule {}
