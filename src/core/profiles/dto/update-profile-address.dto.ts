import { PartialType } from '@nestjs/swagger';
import { CreateProfileAddressDto } from './create-profile-address.dto';

export class UpdateProfileAddressDto extends PartialType(CreateProfileAddressDto) {}
