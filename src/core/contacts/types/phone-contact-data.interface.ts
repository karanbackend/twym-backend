/**
 * Type-safe interface for phone contact import data
 * Reusable across service methods and DTOs
 */

export interface PhoneContactPhone {
    number: string;
    type?: string;
}

export interface PhoneContactEmail {
    email: string;
    type?: string;
}

export interface PhoneContactAddress {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    type?: string;
}

export interface PhoneContactData {
    name: string;
    company_name?: string;
    title?: string;
    department?: string;
    notes?: string;
    phone_numbers?: PhoneContactPhone[];
    emails?: PhoneContactEmail[];
    addresses?: PhoneContactAddress[];
    phone_contact_id?: string;
}
