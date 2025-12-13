import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
    @IsOptional()
    @IsString()
    user_id: string;

    @IsOptional()
    @IsString()
    name: string;
}
