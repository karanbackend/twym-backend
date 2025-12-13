import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserFileService } from './user-file.service';
import { UploadUserFileResponseDto } from './dto/upload-user-file-response.dto';
import { CurrentAuthUser } from '../../common/decorators/current-auth-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly userFileService: UserFileService,
    ) {}

    @Get()
    @ApiOperation({
        summary: 'List users',
        description: 'Retrieve a list of users.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of users',
    })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get user',
        description: 'Retrieve a user by id.',
    })
    @ApiParam({
        name: 'id',
        description: 'User id',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'User found',
    })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update user',
        description: 'Update fields on an existing user.',
    })
    @ApiParam({
        name: 'id',
        description: 'User id',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'User updated',
    })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete user',
        description: 'Remove a user.',
    })
    @ApiParam({
        name: 'id',
        description: 'User id',
        type: String,
    })
    @ApiResponse({
        status: 204,
        description: 'User deleted',
    })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Get('files/my-files')
    @ApiOperation({
        summary: 'Get my uploaded files',
        description: 'Retrieve all uploaded files for the authenticated user.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of user files',
        type: UploadUserFileResponseDto,
        isArray: true,
    })
    getMyFiles(@CurrentAuthUser() user: { id: string }): Promise<UploadUserFileResponseDto[]> {
        return this.userFileService.getFilesByUserId(user.id);
    }

    @Delete('files/:fileId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete uploaded file',
        description:
            'Delete an uploaded file. This will also remove the URL from the profile if applicable.',
    })
    @ApiParam({
        name: 'fileId',
        description: 'File id to delete',
        type: String,
    })
    @ApiResponse({
        status: 204,
        description: 'File deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'File not found',
    })
    async deleteFile(
        @CurrentAuthUser() user: { id: string },
        @Param('fileId') fileId: string,
    ): Promise<void> {
        return this.userFileService.deleteFile(fileId, user.id);
    }
}
