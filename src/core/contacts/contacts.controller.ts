import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiConsumes,
    ApiBody,
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateScannedContactDto } from './dto/create-scanned-contact.dto';
import { UploadBusinessCardDto } from './dto/business-card.dto';
import { CreateContactPhoneNumbersDto } from './dto/create-contact-phone-numbers.dto';
import { CreateContactEmailsDto } from './dto/create-contact-emails.dto';
import { CreateContactAddressesDto } from './dto/create-contact-addresses.dto';
import { CreateContactLinksDto } from './dto/create-contact-links.dto';
import { ImportPhoneContactDto } from './dto/import-phone-contact.dto';
import { CurrentAuthUser } from '../../common/decorators/current-auth-user.decorator';
import type { AuthUser } from '../../common/decorators/current-auth-user.decorator';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    // US-C5: Manual Contact Creation
    @Post()
    @ApiOperation({ summary: 'Create contact (manual)' })
    create(@Body() createContactDto: CreateContactDto, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.create(createContactDto, user.id);
    }

    // US-C1: Scan QR Code & US-C4: Scan Event Badge
    @Post('scan')
    @ApiOperation({ summary: 'Create contact (scanned QR/badge)' })
    createScanned(@Body() dto: CreateScannedContactDto, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.createScannedContact(dto, user.id);
    }

    // US-C7: Lounge Connection
    /*
  @Post('lounge/connect')
  createLoungeConnection(
    @Body()
    dto: {
      user_id: string;
      lounge_session_id: string;
      event_id?: string;
    },
    @CurrentAuthUser() user: AuthUser,
  ) {
    return this.contactsService.createLoungeConnection(
      user.id,
      dto.user_id,
      dto.lounge_session_id,
      dto.event_id,
    );
  }
  */

    // US-C9: Import Contact from Phone
    @Post('import-from-phone')
    @ApiOperation({ summary: 'Import contact from phone' })
    importFromPhone(@Body() dto: ImportPhoneContactDto, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.importFromPhone(user.id, dto);
    }

    // US-C2 & US-C3: Upload Business Card
    @Post('upload-business-card')
    @ApiOperation({ summary: 'Upload business card' })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Business card image file with optional metadata',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Business card image (jpg, jpeg, png, or pdf, max 10MB)',
                },
                side: {
                    type: 'string',
                    enum: ['front', 'back'],
                    description: 'Side of business card',
                    default: 'front',
                },
            },
            required: ['file'],
        },
    })
    uploadBusinessCard(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: UploadBusinessCardDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.uploadBusinessCard(user.id, file, dto);
    }

    // US-C2 & US-C3: Upload Business Card for Existing Contact
    @Post(':id/upload-business-card')
    @ApiOperation({ summary: 'Upload business card for existing contact' })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Business card image file for existing contact',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Business card image (jpg, jpeg, png, or pdf, max 10MB)',
                },
                side: {
                    type: 'string',
                    enum: ['front', 'back'],
                    description: 'Side of business card',
                    default: 'front',
                },
            },
            required: ['file'],
        },
    })
    uploadBusinessCardForContact(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: UploadBusinessCardDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.uploadBusinessCard(user.id, file, {
            ...dto,
            contact_id: id,
        });
    }

    // US-C8: Search Contacts with Filters
    @Get('search')
    @ApiOperation({ summary: 'Search contacts with filters' })
    search(
        @CurrentAuthUser() user: AuthUser,
        @Query('q') query: string,
        @Query('sort') sortBy?: string,
        @Query('tag') filterByTag?: string,
        @Query('event') filterByEvent?: string,
        @Query('acquired_via') filterByAcquiredVia?: string,
        @Query('scanned_type') filterByScannedType?: string,
        @Query('pinned') isPinned?: string,
        @Query('favorite') isFavorite?: string,
    ) {
        return this.contactsService.search(user.id, query || '', {
            sortBy,
            filterByTag,
            filterByEvent,
            filterByAcquiredVia,
            filterByScannedType,
            isPinned: isPinned === 'true',
            isFavorite: isFavorite === 'true',
        });
    }

    // US-C18: View Recently Deleted
    @Get('deleted')
    @ApiOperation({ summary: 'List recently deleted contacts' })
    getDeleted(@CurrentAuthUser() user: AuthUser) {
        return this.contactsService.findDeleted(user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List contacts' })
    findAll(@CurrentAuthUser() user: AuthUser) {
        return this.contactsService.findAll(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get contact by id' })
    @ApiParam({ name: 'id', description: 'Contact ID' })
    findOne(@Param('id') id: string, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.findOne(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update contact' })
    @ApiParam({ name: 'id', description: 'Contact ID' })
    update(
        @Param('id') id: string,
        @Body() updateContactDto: UpdateContactDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.update(id, user.id, updateContactDto);
    }

    // US-C14: Tag Management
    @Post(':id/tags')
    @ApiOperation({ summary: 'Add tags to contact' })
    addTags(
        @Param('id') id: string,
        @Body('tags') tags: string[],
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.addTags(id, user.id, tags);
    }

    @Delete(':id/tags')
    @ApiOperation({ summary: 'Remove tags from contact' })
    removeTags(
        @Param('id') id: string,
        @Body('tags') tags: string[],
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.removeTags(id, user.id, tags);
    }

    // US-C15: Toggle Favorite
    @Patch(':id/favorite')
    @ApiOperation({ summary: 'Toggle favorite flag' })
    toggleFavorite(
        @Param('id') id: string,
        @Body('is_favorite') isFavorite: boolean,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.toggleFavorite(id, user.id, isFavorite);
    }

    // US-C16: Toggle Pin
    @Patch(':id/pin')
    @ApiOperation({ summary: 'Toggle pin flag' })
    togglePin(
        @Param('id') id: string,
        @Body('is_pinned') isPinned: boolean,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.togglePin(id, user.id, isPinned);
    }

    // US-C17: Update Notes
    @Patch(':id/notes')
    @ApiOperation({ summary: 'Update contact notes' })
    updateNotes(
        @Param('id') id: string,
        @Body('notes') notes: string,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.updateNotes(id, user.id, notes);
    }

    // US-C18: Soft Delete
    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete contact' })
    remove(@Param('id') id: string, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.remove(id, user.id);
    }

    // US-C18: Restore
    @Post(':id/restore')
    @ApiOperation({ summary: 'Restore soft-deleted contact' })
    restore(@Param('id') id: string, @CurrentAuthUser() user: AuthUser) {
        return this.contactsService.restore(id, user.id);
    }

    // Nested children endpoints
    @Post(':id/phone-numbers')
    @ApiOperation({ summary: 'Add phone numbers' })
    addPhoneNumbers(
        @Param('id') contactId: string,
        @Body() dto: CreateContactPhoneNumbersDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.createPhoneNumbers(contactId, user.id, dto);
    }

    @Post(':id/emails')
    @ApiOperation({ summary: 'Add emails' })
    addEmails(
        @Param('id') contactId: string,
        @Body() dto: CreateContactEmailsDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.createEmails(contactId, user.id, dto);
    }

    @Post(':id/addresses')
    @ApiOperation({ summary: 'Add addresses' })
    addAddresses(
        @Param('id') contactId: string,
        @Body() dto: CreateContactAddressesDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.createAddresses(contactId, user.id, dto);
    }

    @Post(':id/links')
    @ApiOperation({ summary: 'Add links' })
    addLinks(
        @Param('id') contactId: string,
        @Body() dto: CreateContactLinksDto,
        @CurrentAuthUser() user: AuthUser,
    ) {
        return this.contactsService.createLinks(contactId, user.id, dto);
    }
}
