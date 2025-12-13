# Storage Module

This module provides an abstraction layer for file storage operations, allowing you to easily swap between different storage providers (Supabase, AWS S3, Google Cloud Storage, etc.) without changing consumer code.

## Architecture

The storage module follows the **Dependency Inversion Principle** by using an interface-based design:

- **IStorageService**: Interface defining storage operations
- **SupabaseStorageService**: Concrete implementation using Supabase Storage
- **STORAGE_SERVICE**: Injection token for DI

## Current Implementation

Currently using **Supabase Storage** as the storage provider.

## Usage

### In a Service

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IStorageService, STORAGE_SERVICE } from '@/common/storage';

@Injectable()
export class MyService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async uploadFile(file: Express.Multer.File) {
    const result = await this.storageService.uploadFile(
      'my-bucket',
      'files',
      file,
      'prefix',
    );
    // Prefer signedUrl when available (private buckets)
    return result.signedUrl ?? result.publicUrl;
  }
}
```

### In a Module

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage';
import { MyService } from './my.service';

@Module({
  imports: [StorageModule],
  providers: [MyService],
})
export class MyModule {}
```

## Adding a New Storage Provider

To add a new storage provider (e.g., AWS S3):

### 1. Create the Implementation

```typescript
// src/common/storage/providers/s3-supabase-storage.service.ts
import { Injectable } from '@nestjs/common';
import { IStorageService, UploadResult } from '../interfaces/storage.interface';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3StorageService implements IStorageService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(
    bucketName: string,
    basePath: string,
    file: Express.Multer.File,
    filePrefix?: string,
  ): Promise<UploadResult> {
    // Implement S3 upload logic
    const fileName = `${filePrefix}-${Date.now()}`;
    const key = `${basePath}/${fileName}`;

    await this.s3.putObject({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();

    return {
      filePath: key,
      publicUrl: this.getPublicUrl(bucketName, key),
    };
  }

  async deleteFile(bucketName: string, filePath: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: bucketName,
      Key: filePath,
    }).promise();
  }

  getPublicUrl(bucketName: string, filePath: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${filePath}`;
  }
}
```

### 2. Update the StorageModule

```typescript
// src/common/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseStorageService } from './storage.service';
import { S3StorageService } from './providers/s3-storage.service';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('STORAGE_PROVIDER');
        
        switch (provider) {
          case 's3':
            return new S3StorageService();
          case 'supabase':
          default:
            return new SupabaseStorageService(/* inject dependencies */);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
```

### 3. Configure Environment

```env
STORAGE_PROVIDER=s3  # or 'supabase'
```

## Benefits

- **Loose Coupling**: Consumer code depends on abstractions, not concrete implementations
- **Easy Testing**: Mock the IStorageService interface for unit tests
- **Flexibility**: Switch storage providers by changing configuration
- **Maintainability**: All storage logic is centralized in one module
- **SOLID Principles**: Follows Dependency Inversion and Single Responsibility

## Interface Methods

### uploadFile
Uploads a file to storage.

**Parameters:**
- `bucketName: string` - Name of the storage bucket
- `basePath: string` - Base path within the bucket
- `file: Express.Multer.File` - File to upload
- `filePrefix?: string` - Optional prefix for the filename

**Returns:** `Promise<UploadResult>` - Contains `filePath` and `publicUrl`

### deleteFile
Deletes a file from storage.

**Parameters:**
- `bucketName: string` - Name of the storage bucket
- `filePath: string` - Path to the file

**Returns:** `Promise<void>`

### getPublicUrl
Gets the public URL for a file.

**Parameters:**
- `bucketName: string` - Name of the storage bucket
- `filePath: string` - Path to the file

**Returns:** `Promise<string>` - Public URL to access the file
