import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAuthUser } from '../../common/decorators/current-auth-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users/accounts')
@Controller('users/accounts')
export class AccountController {
    constructor(private readonly usersService: UsersService) {}

    @Post('delete')
    @ApiOperation({
        summary: 'Request account deletion',
        description:
            'Request deletion of the authenticated user account. Account will be locked immediately and permanently removed after the 30-day grace period.',
    })
    @ApiResponse({ status: 200, description: 'Deletion requested' })
    async requestDeletion(@CurrentAuthUser() user: { id: string }) {
        return this.usersService.requestAccountDeletion(user.id);
    }

    @Post('cancel-deletion')
    @ApiOperation({
        summary: 'Cancel account deletion',
        description: 'Cancel a previously requested account deletion within the grace period.',
    })
    @ApiResponse({ status: 200, description: 'Deletion cancelled' })
    async cancelDeletion(@CurrentAuthUser() user: { id: string }) {
        return this.usersService.cancelAccountDeletion(user.id);
    }
}
