import { IsBoolean, IsOptional } from 'class-validator';

export class MarkSubmissionReadDto {
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;
}
