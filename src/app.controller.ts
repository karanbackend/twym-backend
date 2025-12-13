import { Controller, Get, Redirect, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiInfoResponseDto } from './common/dto/api-info-response.dto';
import { IsPublic } from './common/decorators/current-auth-user.decorator';

@ApiExcludeController()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @IsPublic()
    @Get()
    @Redirect('/api/v1', 302)
    redirectRoot() {
        // This redirects / to /api/v1
    }

    @IsPublic()
    @Get('api')
    @Redirect('/api/v1', 302)
    redirectApi() {
        // This redirects /api to /api/v1
    }

    @IsPublic()
    @Get('api/v1')
    getApiInfo(@Req() req: Request): ApiInfoResponseDto {
        return this.appService.getApiInfo(req);
    }
}
