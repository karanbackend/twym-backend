import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import type {
    PhoneContactData,
    PhoneContactPhone,
    PhoneContactEmail,
    PhoneContactAddress,
} from '../types/phone-contact-data.interface';

class PhoneContactPhoneDto implements PhoneContactPhone {
    @ApiProperty({ description: 'Phone number', example: '+1234567890' })
    @IsString()
    number!: string;

    @ApiPropertyOptional({ description: 'Phone type', example: 'mobile' })
    @IsOptional()
    @IsString()
    type?: string;
}

class PhoneContactEmailDto implements PhoneContactEmail {
    @ApiProperty({ description: 'Email address', example: 'john@example.com' })
    @IsEmail()
    email!: string;

    @ApiPropertyOptional({ description: 'Email type', example: 'work' })
    @IsOptional()
    @IsString()
    type?: string;
}

class PhoneContactAddressDto implements PhoneContactAddress {
    @ApiPropertyOptional({ description: 'Street address' })
    @IsOptional()
    @IsString()
    street?: string;

    @ApiPropertyOptional({ description: 'City' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'State or province' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Postal code' })
    @IsOptional()
    @IsString()
    postal_code?: string;

    @ApiPropertyOptional({ description: 'Country' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'Address type', example: 'home' })
    @IsOptional()
    @IsString()
    type?: string;
}

/**
 * DTO for importing a contact from phone's native contacts
 * US-C9: View and Search Phone Contacts
 * Implements PhoneContactData interface for type safety
 */
export class ImportPhoneContactDto implements PhoneContactData {
    @ApiProperty({
        description: 'Full name from phone contact',
        example: 'John Doe',
    })
    @IsString()
    @MaxLength(255)
    name!: string;

    @ApiPropertyOptional({
        description: 'Company name from phone contact',
        example: 'Acme Corp',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    company_name?: string;

    @ApiPropertyOptional({
        description: 'Job title from phone contact',
        example: 'Software Engineer',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({
        description: 'Department from phone contact',
        example: 'Engineering',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    department?: string;

    @ApiPropertyOptional({
        type: [PhoneContactPhoneDto],
        description: 'Phone numbers from phone contact',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhoneContactPhoneDto)
    phone_numbers?: PhoneContactPhoneDto[];

    @ApiPropertyOptional({
        type: [PhoneContactEmailDto],
        description: 'Email addresses from phone contact',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhoneContactEmailDto)
    emails?: PhoneContactEmailDto[];

    @ApiPropertyOptional({
        type: [PhoneContactAddressDto],
        description: 'Addresses from phone contact',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhoneContactAddressDto)
    addresses?: PhoneContactAddressDto[];

    @ApiPropertyOptional({
        description: 'Notes from phone contact',
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Native phone contact ID for reference',
        example: 'CNContact:12345',
    })
    @IsOptional()
    @IsString()
    phone_contact_id?: string;
}
