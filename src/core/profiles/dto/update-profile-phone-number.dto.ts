import { PartialType } from '@nestjs/swagger';
import { CreateProfilePhoneNumberDto } from './create-profile-phone-number.dto';

export class UpdateProfilePhoneNumberDto extends PartialType(CreateProfilePhoneNumberDto) {}
