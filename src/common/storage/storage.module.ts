import { forwardRef, Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { SupabaseModule } from '../auth/supabase/supabase.module';

/**
 * Token for dependency injection
 * This allows us to swap implementations without changing consumer code
 */
export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Module({
    imports: [forwardRef(() => SupabaseModule)],
    providers: [
        {
            provide: STORAGE_SERVICE,
            useClass: SupabaseStorageService,
        },
    ],
    exports: [STORAGE_SERVICE],
})
export class StorageModule {}
