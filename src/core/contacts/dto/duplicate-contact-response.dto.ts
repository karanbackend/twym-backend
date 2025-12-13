import { ContactResponseDto } from './contact-response.dto';

/**
 * Response for duplicate contact detection
 */
export class DuplicateContactResponseDto {
    duplicate: boolean;
    existing_contact: ContactResponseDto;
    message: string;
}
