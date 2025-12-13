import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    UploadedFile,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/auth/supabase/supabase-auth.guard';
import { CreateProfileEmailDto } from './dto/create-profile-email.dto';
import { SetPrimaryFlagDto } from './dto/set-primary-flag.dto';
import { CreateProfilePhoneNumberDto } from './dto/create-profile-phone-number.dto';
import { CreateProfileAddressDto } from './dto/create-profile-address.dto';
import { CreateProfileLinkDto } from './dto/create-profile-link.dto';
import { UpdateProfileAddressDto } from './dto/update-profile-address.dto';
import { CurrentAuthUser, IsPublic } from '../../common/decorators/current-auth-user.decorator';
import { UpdateProfileEmailDto } from './dto/update-profile-email.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { UpdateProfilePhoneNumberDto } from './dto/update-profile-phone-number.dto';
import { UpdateProfileLinkDto } from './dto/update-profile-link.dto';
import { UpdateVCardPrivacyDto } from './dto/update-vcard-privacy.dto';
import { ToggleProfileVisibilityDto } from './dto/toggle-profile-visibility.dto';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) {}

    // -------------------- PROFILE CRUD --------------------

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({
        summary: 'Create profile',
        description: 'Create a new profile for a user.',
    })
    @ApiResponse({
        status: 201,
        description: 'Profile created',
        type: ProfileResponseDto,
    })
    create(@Body() createProfileDto: CreateProfileDto, @CurrentAuthUser() user: { id: string }) {
        return this.profilesService.create(createProfileDto, user.id);
    }

    @Get()
    @IsPublic()
    @ApiOperation({
        summary: 'List profiles',
        description: 'Retrieve a list of profiles.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of profiles',
        type: ProfileResponseDto,
        isArray: true,
    })
    findAll() {
        return this.profilesService.findAll();
    }

    @Get('by-user/:userId')
    @IsPublic()
    @ApiOperation({
        summary: 'Get profile by user id',
        description: 'Find a profile by the owner user id.',
    })
    @ApiParam({ name: 'userId', description: 'UUID of the user', type: String })
    findByUserId(@Param('userId') userId: string) {
        return this.profilesService.findByUserId(userId);
    }

    @Get('by-handle/:profileHandle')
    @IsPublic()
    @ApiOperation({
        summary: 'Get profile by handle',
        description: 'Find a profile by its unique handle.',
    })
    @ApiParam({
        name: 'profileHandle',
        description: 'The unique handle of the profile',
        type: String,
    })
    findByProfileHandle(@Param('profileHandle') profileHandle: string) {
        return this.profilesService.findByProfileHandle(profileHandle);
    }

    @Get('by-slug/:slug')
    @IsPublic()
    @ApiOperation({
        summary: 'Get profile by deeplink slug',
        description: 'Find a profile by its unique deeplink slug.',
    })
    @ApiParam({
        name: 'slug',
        description: 'The unique deeplink slug of the profile',
        type: String,
    })
    findByDeeplinkSlug(@Param('slug') slug: string) {
        return this.profilesService.findByDeeplinkSlug(slug);
    }

    @Get(':id')
    @IsPublic()
    @ApiOperation({
        summary: 'Get profile by id',
        description: 'Find a profile by its id.',
    })
    @ApiParam({ name: 'id', description: 'UUID of the profile', type: String })
    findOne(@Param('id') id: string) {
        return this.profilesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update profile',
        description: 'Update a profile.',
    })
    update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.update(id, user.id, updateProfileDto);
    }

    @Patch(':id/visibility')
    @ApiOperation({
        summary: 'Toggle profile visibility (US-P9)',
        description:
            'Make profile public or private. Public = anyone with link can view, Private = only owner can view.',
    })
    @ApiResponse({
        status: 200,
        description: 'Profile visibility updated',
        type: ProfileResponseDto,
    })
    toggleVisibility(
        @Param('id') id: string,
        @Body() dto: ToggleProfileVisibilityDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updateVisibility(id, user.id, dto.is_public);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete profile',
        description: 'Delete a profile.',
    })
    @ApiResponse({ status: 204, description: 'Profile deleted' })
    remove(@Param('id') id: string, @CurrentAuthUser() user: { id: string }) {
        return this.profilesService.remove(id, user.id);
    }

    // -------------------- AVATAR --------------------

    @Post(':id/profile-image')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Profile image file',
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiOperation({
        summary: 'Upload profile image',
        description: 'Upload profile image.',
    })
    uploadProfile(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.uploadProfileImage(id, user.id, file);
    }

    @Post(':id/cover-image')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Avatar profile cover image file',
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiOperation({
        summary: 'Upload cover image',
        description: 'Upload cover image.',
    })
    uploadCoverImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.uploadCoverImage(id, user.id, file);
    }

    // -------------------- EMAILS --------------------

    @Post(':id/emails')
    @HttpCode(HttpStatus.CREATED)
    createEmails(
        @Param('id') id: string,
        @Body() dto: CreateProfileEmailDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.createEmails(id, user.id, dto);
    }

    @Patch(':id/emails')
    updateEmails(
        @Param('id') id: string,
        @Body() dto: UpdateProfileEmailDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updateEmails(id, user.id, dto);
    }

    @Delete(':id/emails')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteEmails(
        @Param('id') id: string,
        @Body() dto: BulkDeleteDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.removeEmails(id, user.id, dto);
    }

    @Patch(':id/emails/:emailId/primary')
    setPrimaryEmail(
        @Param('id') id: string,
        @Param('emailId') emailId: string,
        @Body() dto: SetPrimaryFlagDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.setPrimaryEmail(id, user.id, emailId, dto.isPrimary);
    }

    // -------------------- PHONE NUMBERS --------------------

    @Post(':id/phone-numbers')
    @HttpCode(HttpStatus.CREATED)
    createPhoneNumbers(
        @Param('id') id: string,
        @Body() dto: CreateProfilePhoneNumberDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.createPhoneNumbers(id, user.id, dto);
    }

    @Patch(':id/phone-numbers')
    updatePhoneNumbers(
        @Param('id') id: string,
        @Body() dto: UpdateProfilePhoneNumberDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updatePhoneNumbers(id, user.id, dto);
    }

    @Delete(':id/phone-numbers')
    @HttpCode(HttpStatus.NO_CONTENT)
    deletePhoneNumbers(
        @Param('id') id: string,
        @Body() dto: BulkDeleteDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.removePhoneNumbers(id, user.id, dto);
    }

    @Patch(':id/phone-numbers/:phoneNumberId/primary')
    setPrimaryPhoneNumber(
        @Param('id') id: string,
        @Param('phoneNumberId') phoneNumberId: string,
        @Body() dto: SetPrimaryFlagDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.setPrimaryPhoneNumber(
            id,
            user.id,
            phoneNumberId,
            dto.isPrimary,
        );
    }

    // -------------------- ADDRESSES --------------------

    @Post(':id/addresses')
    @HttpCode(HttpStatus.CREATED)
    createAddresses(
        @Param('id') id: string,
        @Body() dto: CreateProfileAddressDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.createAddresses(id, user.id, dto);
    }

    @Patch(':id/addresses')
    updateAddresses(
        @Param('id') id: string,
        @Param('addressId') addressId: string,
        @Body() dto: UpdateProfileAddressDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updateAddresses(id, user.id, dto);
    }

    @Delete(':id/addresses')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteAddresses(
        @Param('id') id: string,
        @Body() dto: BulkDeleteDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.removeAddresses(id, user.id, dto);
    }

    @Patch(':id/addresses/:addressId/primary')
    setPrimaryAddress(
        @Param('id') id: string,
        @Param('addressId') addressId: string,
        @Body() dto: SetPrimaryFlagDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.setPrimaryAddress(id, user.id, addressId, dto.isPrimary);
    }

    // -------------------- LINKS --------------------

    @Post(':id/links')
    @HttpCode(HttpStatus.CREATED)
    createLinks(
        @Param('id') id: string,
        @Body() dto: CreateProfileLinkDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.createLinks(id, user.id, dto);
    }

    @Patch(':id/links')
    updateLinks(
        @Param('id') id: string,
        @Body() dto: UpdateProfileLinkDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updateLinks(id, user.id, dto);
    }

    @Delete(':id/links')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteLinks(
        @Param('id') id: string,
        @Body() dto: BulkDeleteDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.removeLinks(id, user.id, dto);
    }

    // -------------------- VCARD --------------------

    @Patch(':id/vcard/privacy')
    @ApiOperation({
        summary: 'Update vCard privacy settings',
        description:
            'Control what information appears in the downloadable vCard (photo, social links, addresses)',
    })
    @ApiResponse({
        status: 200,
        description: 'vCard privacy settings updated',
        type: ProfileResponseDto,
    })
    updateVCardPrivacy(
        @Param('id') id: string,
        @Body() dto: UpdateVCardPrivacyDto,
        @CurrentAuthUser() user: { id: string },
    ) {
        return this.profilesService.updateVCardPrivacySettings(id, user.id, dto);
    }

    @Get(':id/vcard/generate')
    @ApiOperation({
        summary: 'Generate my vCard with QR code',
        description:
            'Generate downloadable vCard respecting privacy settings, includes QR code for sharing',
    })
    @ApiResponse({
        status: 200,
        description: 'vCard generated with QR code',
        schema: {
            type: 'object',
            properties: {
                vcard: {
                    type: 'string',
                    description: 'vCard content (text/vcard)',
                },
                qrCode: {
                    type: 'string',
                    nullable: true,
                    description: 'QR code as base64 data URI',
                },
            },
        },
    })
    generateMyVCard(@Param('id') id: string, @CurrentAuthUser() user: { id: string }) {
        return this.profilesService.generateVCard(id, user.id);
    }

    @Get(':id/vcard')
    @IsPublic()
    @ApiOperation({
        summary: 'Download vCard (public)',
        description: 'Download vCard file for public profile',
    })
    @ApiResponse({
        status: 200,
        description: 'vCard content',
        content: {
            'text/vcard': {
                schema: {
                    type: 'string',
                },
            },
        },
    })
    downloadVCard(@Param('id') id: string) {
        return this.profilesService.getVCard(id);
    }

    @Get('handle/:handle/vcard')
    @IsPublic()
    @ApiOperation({
        summary: 'Download vCard by handle (public)',
        description: 'Download public vCard by handle',
    })
    @ApiParam({ name: 'handle', description: 'Profile handle', type: String })
    @ApiResponse({
        status: 200,
        description: 'vCard content',
        content: {
            'text/vcard': {
                schema: {
                    type: 'string',
                },
            },
        },
    })
    downloadVCardByHandle(@Param('handle') handle: string) {
        return this.profilesService.getVCardByHandle(handle);
    }

    // -------------------- QR CODE IMAGES --------------------

    @Get(':handle/page-qr.png')
    @IsPublic()
    @ApiOperation({
        summary: 'Get profile page QR code image',
        description:
            'Generate and serve profile page QR code as PNG image. QR code points to public profile URL.',
    })
    @ApiParam({
        name: 'handle',
        description: 'Profile handle',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'QR code PNG image',
        content: {
            'image/png': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async getProfileQrCode(@Param('handle') handle: string, @Res() res: Response) {
        const qrBuffer = await this.profilesService.generateProfileQrCode(handle);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(qrBuffer);
    }

    @Get(':handle/vcard-qr.png')
    @IsPublic()
    @ApiOperation({
        summary: 'Get vCard QR code image',
        description:
            'Generate and serve vCard QR code as PNG image. QR code points to vCard download URL.',
    })
    @ApiParam({
        name: 'handle',
        description: 'Profile handle',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'QR code PNG image',
        content: {
            'image/png': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async getVCardQrCode(@Param('handle') handle: string, @Res() res: Response) {
        const qrBuffer = await this.profilesService.generateVCardQrCode(handle);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(qrBuffer);
    }
}
