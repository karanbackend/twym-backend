import { ContactResponseDto } from './contact-response.dto';

/**
 * Response for event contact creation (creates contacts for both organizer and guest)
 */
export class EventContactsResponseDto {
    organizer_contact: ContactResponseDto;
    guest_contact: ContactResponseDto;
}
