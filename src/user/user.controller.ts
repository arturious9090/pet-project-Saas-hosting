import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @UseGuards()
    @Get('profile')
    async profile(@Req() req: any) {
        return req.user
    }
}
