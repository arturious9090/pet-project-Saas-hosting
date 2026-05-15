import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('sign-in')
    async login(
        @Req() req: CurrentUserRequest,
        @Res({ passthrough: true }) res: Response
    ) {
        const sessionId = await this.authService.login(req.user, { ip: req.ip, ua: req.headers['user-agent'] })
        return res.cookie('session_id', sessionId, { httpOnly: true, maxAge: 5 * 24 * 60 * 60 * 1000 })
    }

    @Post('sign-up')
    async register(
        @Req() req,
        @Body() dto: RegisterDto
    ) {
        return await this.authService.register(dto)
    }

    @UseGuards(LocalAuthGuard)
    @Post('sign-out')
    async logout(@Req() req) {
        return req.logout()
    }
}
