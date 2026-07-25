import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SessionGuard } from 'src/auth/session.guard';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';

@Controller('api/user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @UseGuards(SessionGuard)
    @Get('profile')
    async profile(@Req() req: CurrentUserRequest) {
        return req.user
    }
}
