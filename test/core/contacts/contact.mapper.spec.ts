import { ContactMapper } from '../../../src/core/contacts/contact.mapper';
import { Contact } from '../../../src/core/contacts/entities/contact.entity';
import { ContactPhoneNumber } from '../../../src/core/contacts/entities/contact-phone-number.entity';
import { ContactEmail } from '../../../src/core/contacts/entities/contact-email.entity';
import { ContactAddress } from '../../../src/core/contacts/entities/contact-address.entity';
import { ContactLink } from '../../../src/core/contacts/entities/contact-link.entity';
import {
    PHONE_NUMBER_TYPE,
    EMAIL_TYPE,
    ADDRESS_TYPE,
    LINK_TYPE,
    ACQUIRED_VIA,
} from '../../../src/core/contacts/enums';

describe('ContactMapper', () => {
    describe('mapToDto', () => {
        it('should map contact entity to DTO', () => {
            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                contactType: 'external',
                name: 'John Doe',
                title: 'Software Engineer',
                companyName: 'Tech Corp',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                isFavorite: false,
                isPinned: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
                phoneNumbers: [],
                emails: [],
                addresses: [],
                links: [],
                files: [],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result).toBeDefined();
            expect(result.id).toBe('contact-1');
            expect(result.owner_id).toBe('user-123');
            expect(result.name).toBe('John Doe');
            expect(result.title).toBe('Software Engineer');
            expect(result.company_name).toBe('Tech Corp');
            expect(result.acquired_via).toBe(ACQUIRED_VIA.MANUAL);
        });

        it('should handle null values correctly', () => {
            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                name: null,
                title: null,
                companyName: null,
                acquiredVia: ACQUIRED_VIA.MANUAL,
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.name).toBeNull();
            expect(result.title).toBeNull();
            expect(result.company_name).toBeNull();
        });

        it('should map phone numbers', () => {
            const phoneNumber: ContactPhoneNumber = {
                id: 'phone-1',
                contactId: 'contact-1',
                rawNumber: '+1234567890',
                numberType: PHONE_NUMBER_TYPE.MOBILE,
                isPrimary: true,
            } as ContactPhoneNumber;

            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                phoneNumbers: [phoneNumber],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.phone_numbers).toHaveLength(1);
            expect(result.phone_numbers[0].raw_number).toBe('+1234567890');
            expect(result.phone_numbers[0].number_type).toBe(PHONE_NUMBER_TYPE.MOBILE);
            expect(result.phone_numbers[0].is_primary).toBe(true);
        });

        it('should map emails', () => {
            const email: ContactEmail = {
                id: 'email-1',
                contactId: 'contact-1',
                email: 'john@example.com',
                emailType: EMAIL_TYPE.WORK,
                isPrimary: true,
            } as ContactEmail;

            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                emails: [email],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.emails).toHaveLength(1);
            expect(result.emails[0].email).toBe('john@example.com');
            expect(result.emails[0].email_type).toBe(EMAIL_TYPE.WORK);
            expect(result.emails[0].is_primary).toBe(true);
        });

        it('should map addresses', () => {
            const address: ContactAddress = {
                id: 'address-1',
                contactId: 'contact-1',
                streetName: 'Main St',
                city: 'New York',
                country: 'USA',
                addressType: ADDRESS_TYPE.BUSINESS,
            } as ContactAddress;

            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                addresses: [address],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.addresses).toHaveLength(1);
            expect(result.addresses[0].street_name).toBe('Main St');
            expect(result.addresses[0].city).toBe('New York');
            expect(result.addresses[0].country).toBe('USA');
        });

        it('should map links', () => {
            const link: ContactLink = {
                id: 'link-1',
                contactId: 'contact-1',
                url: 'https://linkedin.com/in/johndoe',
                platform: 'LinkedIn',
                linkType: LINK_TYPE.SOCIAL,
            } as ContactLink;

            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                links: [link],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.links).toHaveLength(1);
            expect(result.links[0].url).toBe('https://linkedin.com/in/johndoe');
            expect(result.links[0].platform).toBe('LinkedIn');
        });

        it('should handle empty arrays', () => {
            const entity: Contact = {
                id: 'contact-1',
                ownerId: 'user-123',
                phoneNumbers: [],
                emails: [],
                addresses: [],
                links: [],
                files: [],
            } as Contact;

            const result = ContactMapper.mapToDto(entity);

            expect(result.phone_numbers).toEqual([]);
            expect(result.emails).toEqual([]);
            expect(result.addresses).toEqual([]);
            expect(result.links).toEqual([]);
        });
    });

    describe('mapToEntity', () => {
        it('should map create DTO to entity', () => {
            const dto = {
                user_id: 'user-123',
                name: 'John Doe',
                title: 'Engineer',
                company_name: 'Tech Corp',
                acquired_via: ACQUIRED_VIA.MANUAL,
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.ownerId).toBe('user-123');
            expect(result.name).toBe('John Doe');
            expect(result.title).toBe('Engineer');
            expect(result.companyName).toBe('Tech Corp');
            expect(result.acquiredVia).toBe(ACQUIRED_VIA.MANUAL);
        });

        it('should handle undefined values', () => {
            const dto = {
                name: 'John Doe',
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.name).toBe('John Doe');
            expect(result.ownerId).toBeUndefined();
            expect(result.title).toBeUndefined();
        });

        it('should map phone numbers from DTO', () => {
            const dto = {
                phone_numbers: [
                    {
                        raw_number: '+1234567890',
                        number_type: PHONE_NUMBER_TYPE.MOBILE,
                    },
                ],
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.phoneNumbers).toHaveLength(1);
            expect(result.phoneNumbers![0].rawNumber).toBe('+1234567890');
            expect(result.phoneNumbers![0].numberType).toBe(PHONE_NUMBER_TYPE.MOBILE);
        });

        it('should map emails from DTO', () => {
            const dto = {
                emails: [{ email: 'john@example.com', email_type: EMAIL_TYPE.WORK }],
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.emails).toHaveLength(1);
            expect(result.emails![0].email).toBe('john@example.com');
            expect(result.emails![0].emailType).toBe(EMAIL_TYPE.WORK);
        });

        it('should map addresses from DTO', () => {
            const dto = {
                addresses: [
                    {
                        street_name: 'Main St',
                        city: 'New York',
                        address_type: ADDRESS_TYPE.BUSINESS,
                    },
                ],
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.addresses).toHaveLength(1);
            expect(result.addresses![0].streetName).toBe('Main St');
            expect(result.addresses![0].city).toBe('New York');
        });

        it('should map links from DTO', () => {
            const dto = {
                links: [
                    {
                        url: 'https://linkedin.com/in/user',
                        platform: 'LinkedIn',
                        link_type: LINK_TYPE.SOCIAL,
                    },
                ],
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.links).toHaveLength(1);
            expect(result.links![0].url).toBe('https://linkedin.com/in/user');
            expect(result.links![0].platform).toBe('LinkedIn');
        });

        it('should set default contact_type to external', () => {
            const dto = {
                name: 'John Doe',
            };

            const result = ContactMapper.mapToEntity(dto as any);

            expect(result.contactType).toBeUndefined();
        });
    });

    describe('mapPhoneNumberToDto', () => {
        it('should map phone number entity to DTO', () => {
            const entity: ContactPhoneNumber = {
                id: 'phone-1',
                contactId: 'contact-1',
                rawNumber: '+1234567890',
                countryCode: '+1',
                nationalNumber: '234567890',
                numberType: PHONE_NUMBER_TYPE.MOBILE,
                isPrimary: true,
            } as ContactPhoneNumber;

            const result = ContactMapper.mapPhoneNumberToDto(entity);

            expect(result.id).toBe('phone-1');
            expect(result.raw_number).toBe('+1234567890');
            expect(result.country_code).toBe('+1');
            expect(result.number_type).toBe(PHONE_NUMBER_TYPE.MOBILE);
            expect(result.is_primary).toBe(true);
        });
    });

    describe('mapEmailToDto', () => {
        it('should map email entity to DTO', () => {
            const entity: ContactEmail = {
                id: 'email-1',
                contactId: 'contact-1',
                email: 'john@example.com',
                emailType: EMAIL_TYPE.WORK,
                isPrimary: true,
            } as ContactEmail;

            const result = ContactMapper.mapEmailToDto(entity);

            expect(result.id).toBe('email-1');
            expect(result.email).toBe('john@example.com');
            expect(result.email_type).toBe(EMAIL_TYPE.WORK);
            expect(result.is_primary).toBe(true);
        });
    });

    describe('mapAddressToDto', () => {
        it('should map address entity to DTO', () => {
            const entity: ContactAddress = {
                id: 'address-1',
                contactId: 'contact-1',
                streetNumber: '123',
                streetName: 'Main St',
                city: 'New York',
                stateProvince: 'NY',
                postalCode: '10001',
                country: 'USA',
                addressType: ADDRESS_TYPE.BUSINESS,
                isPrimary: true,
            } as ContactAddress;

            const result = ContactMapper.mapAddressToDto(entity);

            expect(result.id).toBe('address-1');
            expect(result.street_number).toBe('123');
            expect(result.street_name).toBe('Main St');
            expect(result.city).toBe('New York');
            expect(result.state_province).toBe('NY');
            expect(result.postal_code).toBe('10001');
            expect(result.country).toBe('USA');
            expect(result.address_type).toBe(ADDRESS_TYPE.BUSINESS);
            expect(result.is_primary).toBe(true);
        });
    });

    describe('mapLinkToDto', () => {
        it('should map link entity to DTO', () => {
            const entity: ContactLink = {
                id: 'link-1',
                contactId: 'contact-1',
                url: 'https://linkedin.com/in/user',
                platform: 'LinkedIn',
                linkType: LINK_TYPE.SOCIAL,
            } as ContactLink;

            const result = ContactMapper.mapLinkToDto(entity);

            expect(result.id).toBe('link-1');
            expect(result.url).toBe('https://linkedin.com/in/user');
            expect(result.platform).toBe('LinkedIn');
            expect(result.link_type).toBe(LINK_TYPE.SOCIAL);
        });
    });

    describe('mapPhoneNumberDtoToEntity', () => {
        it('should map phone number DTO to entity', () => {
            const dto = {
                raw_number: '+1234567890',
                country_code: '+1',
                area_code: '234',
                local_number: '5678900',
                number_type: PHONE_NUMBER_TYPE.MOBILE,
                is_primary: true,
            };

            const result = ContactMapper.mapPhoneNumberDtoToEntity(dto as any);

            expect(result.rawNumber).toBe('+1234567890');
            expect(result.countryCode).toBe('+1');
            expect(result.areaCode).toBe('234');
            expect(result.localNumber).toBe('5678900');
            expect(result.numberType).toBe(PHONE_NUMBER_TYPE.MOBILE);
            expect(result.isPrimary).toBe(true);
        });
    });

    describe('mapEmailDtoToEntity', () => {
        it('should map email DTO to entity', () => {
            const dto = {
                email: 'john@example.com',
                email_type: EMAIL_TYPE.WORK,
                is_primary: true,
            };

            const result = ContactMapper.mapEmailDtoToEntity(dto as any);

            expect(result.email).toBe('john@example.com');
            expect(result.emailType).toBe(EMAIL_TYPE.WORK);
            expect(result.isPrimary).toBe(true);
        });
    });

    describe('mapAddressDtoToEntity', () => {
        it('should map address DTO to entity', () => {
            const dto = {
                street_number: '123',
                street_name: 'Main St',
                city: 'New York',
                state_province: 'NY',
                postal_code: '10001',
                country: 'USA',
                address_type: ADDRESS_TYPE.BUSINESS,
                is_primary: true,
            };

            const result = ContactMapper.mapAddressDtoToEntity(dto as any);

            expect(result.streetNumber).toBe('123');
            expect(result.streetName).toBe('Main St');
            expect(result.city).toBe('New York');
            expect(result.stateProvince).toBe('NY');
            expect(result.postalCode).toBe('10001');
            expect(result.country).toBe('USA');
            expect(result.addressType).toBe(ADDRESS_TYPE.BUSINESS);
            expect(result.isPrimary).toBe(true);
        });
    });

    describe('mapLinkDtoToEntity', () => {
        it('should map link DTO to entity', () => {
            const dto = {
                url: 'https://linkedin.com/in/user',
                platform: 'LinkedIn',
                link_type: LINK_TYPE.SOCIAL,
            };

            const result = ContactMapper.mapLinkDtoToEntity(dto as any);

            expect(result.url).toBe('https://linkedin.com/in/user');
            expect(result.platform).toBe('LinkedIn');
            expect(result.linkType).toBe(LINK_TYPE.SOCIAL);
        });
    });
});
