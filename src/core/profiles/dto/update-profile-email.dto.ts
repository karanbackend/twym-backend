import { PartialType } from '@nestjs/swagger';
import { CreateProfileEmailDto } from './create-profile-email.dto';

export class UpdateProfileEmailDto extends PartialType(CreateProfileEmailDto) {}
