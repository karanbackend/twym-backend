import { UserFile } from './entities/user-file.entity';
import { UploadUserFileResponseDto } from './dto/upload-user-file-response.dto';

export class UserFileMapper {
    static mapToDto(entity: UserFile): UploadUserFileResponseDto {
        const dto = new UploadUserFileResponseDto();

        dto.id = entity.id;
        dto.ownerId = entity.ownerId;
        dto.fileUrl = entity.fileUrl;
        dto.filename = entity.filename ?? null;
        dto.mimeType = entity.mimeType ?? null;
        dto.sizeBytes = entity.sizeBytes ?? null;
        dto.purpose = entity.purpose ?? null;
        dto.sha256 = entity.sha256 ?? null;
        dto.storageBucket = entity.storageBucket ?? null;
        dto.storageObjectPath = entity.storageObjectPath ?? null;
        dto.metadata = entity.metadata ?? null;
        dto.createdAt = entity.createdAt;

        return dto;
    }
}
