# Storage Architecture - Decoupled Design

## Overview

The storage implementation follows **Dependency Inversion Principle** to avoid tight coupling with Supabase.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐           ┌──────────────────┐              │
│  │   Profiles     │           │   Other Future   │              │
│  │   Controller   │           │   Features       │              │
│  └────────┬───────┘           └────────┬─────────┘              │
│           │                             │                         │
│           ▼                             ▼                         │
│  ┌────────────────┐                                              │
│  │   Profiles     │                                              │
│  │   Service      │                                              │
│  └────────┬───────┘                                              │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │ depends on
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                        Domain Layer                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐        │
│  │          UserFileService (Business Logic)            │        │
│  │                                                       │        │
│  │  - uploadProfileImage()                              │        │
│  │  - uploadCoverImage()                                │        │
│  │  - deleteFile()                                      │        │
│  │                                                       │        │
│  │  Injects: @Inject(STORAGE_SERVICE)                  │        │
│  │           IStorageService (INTERFACE)               │        │
│  └───────────────────────┬──────────────────────────────┘        │
│                          │                                         │
│                          │ uses interface                          │
│                          │                                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                    Abstraction Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────┐        │
│  │        IStorageService (Interface)                    │        │
│  │                                                        │        │
│  │  + uploadFile(bucket, path, file, prefix)            │        │
│  │  + deleteFile(bucket, path)                           │        │
│  │  + getPublicUrl(bucket, path)                         │        │
│  └───────────────────────────────────────────────────────┘        │
│                            ▲                                        │
│                            │ implements                             │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼────────────┐                 ┌─────────▼──────────┐
│  Infrastructure    │                 │  Infrastructure     │
│     Layer          │                 │     Layer          │
├────────────────────┤                 ├────────────────────┤
│                    │                 │                    │
│  Supabase          │                 │  AWS S3            │
│  StorageService    │                 │  StorageService    │
│                    │                 │                    │
│  (Current)         │                 │  (Future)          │
│  ✓ Active          │                 │  ○ Not Yet         │
└────────────────────┘                 └────────────────────┘
```

## Key Benefits

### 1. **Loose Coupling** ✅
```typescript
// Consumer code depends on interface, NOT implementation
constructor(
  @Inject(STORAGE_SERVICE)
  private readonly storage: IStorageService  // ← Interface
) {}
```

### 2. **Easy Provider Swap** ✅
```typescript
// In storage.module.ts - Just change the useClass:
{
  provide: STORAGE_SERVICE,
  useClass: SupabaseStorageService  // ← Swap to S3StorageService
}
```

### 3. **Testability** ✅
```typescript
// Easy to mock in tests
const mockStorage: IStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getPublicUrl: jest.fn()
};
```

### 4. **Multiple Implementations** ✅
You can have:
- `SupabaseStorageService` (current)
- `S3StorageService` (future)
- `GCSStorageService` (future)
- `LocalStorageService` (for dev/testing)
- `MockStorageService` (for tests)

All implementing the same `IStorageService` interface!

## Dependency Flow

```
High Level (Profiles) 
    ↓ depends on
Domain (UserFileService)
    ↓ depends on
Abstraction (IStorageService interface)
    ↑ implemented by
Infrastructure (SupabaseStorageService)
```

This follows the **Dependency Rule**:
> Higher-level modules should not depend on lower-level modules.
> Both should depend on abstractions.

## File Structure

```
src/
├── common/
│   └── storage/                          # ← Abstraction Module
│       ├── interfaces/
│       │   └── storage.interface.ts     # ← Interface (contract)
│       ├── supabase-storage.service.ts           # ← Supabase implementation
│       ├── storage.module.ts            # ← DI configuration
│       ├── index.ts                     # ← Barrel exports
│       └── README.md                    # ← Documentation
│
└── core/
    ├── users/
    │   ├── entities/
    │   │   └── user-file.entity.ts
    │   ├── dto/
    │   │   └── upload-file-response.dto.ts
    │   ├── user-file.service.ts         # ← Uses IStorageService
    │   ├── user-file.repository.ts
    │   ├── user-file.mapper.ts
    │   └── users.module.ts
    │
    └── profiles/
        ├── profiles.service.ts           # ← Uses UserFileService
        ├── profiles.controller.ts
        └── profiles.module.ts
```

## Comparison: Before vs After

### ❌ Before (Tightly Coupled)
```typescript
// Bad: Direct dependency on Supabase
constructor(
  private readonly supabaseService: SupabaseService
) {}

async upload(file) {
  const supabase = this.supabaseService.getClient();
  await supabase.storage.from('bucket').upload(...);
}
```

**Problems:**
- Hard to test (need real Supabase)
- Can't swap providers
- Violates SOLID principles
- Implementation details leak everywhere

### ✅ After (Decoupled)
```typescript
// Good: Depends on abstraction
constructor(
  @Inject(STORAGE_SERVICE)
  private readonly storage: IStorageService
) {}

async upload(file) {
  await this.storage.uploadFile('bucket', 'path', file);
}
```

**Benefits:**
- Easy to test (mock interface)
- Can swap providers via config
- Follows SOLID principles
- Clean separation of concerns

## How to Add New Provider

1. Create implementation: `S3StorageService implements IStorageService`
2. Update module provider configuration
3. Change environment variable
4. **NO changes needed in consumer code!** ✨

## Summary

✅ **NOT tightly coupled** to Supabase  
✅ Interface-based design  
✅ Easy to test  
✅ Easy to extend  
✅ Follows SOLID principles  
✅ Production-ready architecture  

