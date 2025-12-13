import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Ip,
    Headers,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContactFormsService } from './contact-forms.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateContactFormDto } from './dto/create-contact-form.dto';
import { UpdateContactFormDto } from './dto/update-contact-form.dto';
import { SubmitContactFormDto } from './dto/submit-contact-form.dto';
import { MarkSubmissionReadDto } from './dto/mark-submission-read.dto';
import { ContactFormResponseDto } from './dto/contact-form-response.dto';
import { ContactSubmissionResponseDto } from './dto/contact-submission-response.dto';
import { CurrentAuthUser, IsPublic } from '../../common/decorators/current-auth-user.decorator';
import type { AuthUser } from '../../common/decorators/current-auth-user.decorator';

@ApiTags('contact-forms')
@Controller('contact-forms')
export class ContactFormsController {
    constructor(private readonly contactFormsService: ContactFormsService) {}

    // ========== Contact Form Management (Authenticated) ==========

    @Post()
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create contact form',
        description:
            'US-F1: Create a contact form for your profile. Fails if a form already exists.',
    })
    @ApiResponse({ status: 201, type: ContactFormResponseDto })
    async createForm(
        @CurrentAuthUser() user: AuthUser,
        @Body() createContactFormDto: CreateContactFormDto,
    ): Promise<ContactFormResponseDto> {
        return this.contactFormsService.createForm(user.id, createContactFormDto);
    }

    @Get('my-form')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my contact form' })
    @ApiResponse({ status: 200, type: ContactFormResponseDto })
    async getMyForm(@CurrentAuthUser() user: AuthUser): Promise<ContactFormResponseDto> {
        return this.contactFormsService.getFormByUserId(user.id);
    }

    @Patch('my-form')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update my contact form' })
    @ApiResponse({ status: 200, type: ContactFormResponseDto })
    async updateMyForm(
        @CurrentAuthUser() user: AuthUser,
        @Body() updateContactFormDto: UpdateContactFormDto,
    ): Promise<ContactFormResponseDto> {
        return this.contactFormsService.updateForm(user.id, updateContactFormDto);
    }

    @Delete('my-form')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete my contact form' })
    @ApiResponse({ status: 204 })
    async deleteMyForm(@CurrentAuthUser() user: AuthUser): Promise<void> {
        return this.contactFormsService.deleteForm(user.id);
    }

    // ========== Public Form Submission (No Auth) ==========

    @IsPublic()
    @Post('submit/:profileId')
    @ApiOperation({
        summary: 'Submit contact form (public)',
        description: 'US-F2: Visitor submits contact form. Rate limit: 10/day per IP',
    })
    @ApiParam({ name: 'profileId', description: 'Profile ID to submit to' })
    @ApiResponse({ status: 201, type: ContactSubmissionResponseDto })
    async submitForm(
        @Param('profileId') profileId: string,
        @Body() submitDto: SubmitContactFormDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent?: string,
        @Headers('referer') referrer?: string,
    ): Promise<ContactSubmissionResponseDto> {
        submitDto.visitorIp = ip;
        submitDto.userAgent = userAgent;
        submitDto.referrer = referrer;

        return this.contactFormsService.submitForm(profileId, submitDto);
    }

    @IsPublic()
    @Get('public/:profileId')
    @ApiOperation({
        summary: 'Get public contact form by profile ID',
        description: 'Public endpoint to retrieve form structure',
    })
    @ApiParam({ name: 'profileId', description: 'Profile ID' })
    @ApiResponse({ status: 200, type: ContactFormResponseDto })
    async getPublicForm(@Param('profileId') profileId: string): Promise<ContactFormResponseDto> {
        return this.contactFormsService.getFormByProfileId(profileId);
    }

    // ========== Submission Inbox (Authenticated) ==========

    @Get('submissions')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all form submissions',
        description: 'US-F3: View form submissions inbox',
    })
    @ApiQuery({
        name: 'unreadOnly',
        required: false,
        type: Boolean,
        description: 'Filter unread submissions only',
    })
    @ApiResponse({ status: 200, type: [ContactSubmissionResponseDto] })
    async getSubmissions(
        @CurrentAuthUser() user: AuthUser,
        @Query('unreadOnly') unreadOnly?: string,
    ): Promise<ContactSubmissionResponseDto[]> {
        const unread = unreadOnly === 'true';
        return this.contactFormsService.getSubmissions(user.id, unread);
    }

    @Get('submissions/unread-count')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get unread submissions count' })
    @ApiResponse({
        status: 200,
        schema: { properties: { count: { type: 'number' } } },
    })
    async getUnreadCount(@CurrentAuthUser() user: AuthUser): Promise<{ count: number }> {
        const count = await this.contactFormsService.getUnreadCount(user.id);
        return { count };
    }

    @Get('submissions/:submissionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get submission by ID' })
    @ApiParam({ name: 'submissionId', description: 'Submission ID' })
    @ApiResponse({ status: 200, type: ContactSubmissionResponseDto })
    async getSubmissionById(
        @CurrentAuthUser() user: AuthUser,
        @Param('submissionId') submissionId: string,
    ): Promise<ContactSubmissionResponseDto> {
        return this.contactFormsService.getSubmissionById(user.id, submissionId);
    }

    @Patch('submissions/:submissionId/mark-read')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Mark submission as read/unread',
        description: 'US-F5: Dismiss form submission',
    })
    @ApiParam({ name: 'submissionId', description: 'Submission ID' })
    @ApiResponse({ status: 200, type: ContactSubmissionResponseDto })
    async markAsRead(
        @CurrentAuthUser() user: AuthUser,
        @Param('submissionId') submissionId: string,
        @Body() markReadDto: MarkSubmissionReadDto,
    ): Promise<ContactSubmissionResponseDto> {
        return this.contactFormsService.markSubmissionAsRead(user.id, submissionId, markReadDto);
    }

    @Post('submissions/:submissionId/add-to-contacts')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Add submission to contacts',
        description: 'US-F4: Manually add submission to contacts',
    })
    @ApiParam({ name: 'submissionId', description: 'Submission ID' })
    @ApiResponse({ status: 201 })
    async addToContacts(
        @CurrentAuthUser() user: AuthUser,
        @Param('submissionId') submissionId: string,
    ): Promise<any> {
        return this.contactFormsService.addSubmissionToContacts(user.id, submissionId);
    }
}
