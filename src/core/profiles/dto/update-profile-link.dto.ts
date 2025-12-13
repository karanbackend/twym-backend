import { PartialType } from '@nestjs/swagger';
import { CreateProfileLinkDto } from './create-profile-link.dto';

export class UpdateProfileLinkDto extends PartialType(CreateProfileLinkDto) {}
