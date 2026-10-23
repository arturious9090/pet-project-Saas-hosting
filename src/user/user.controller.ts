import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SessionGuard } from 'src/auth/session.guard';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors } from '../swagger/api-errors.decorator';
import { UserProfileResponseDto } from './dto/user-response.dto';
import { SESSION_SECURITY } from '../swagger/swagger';

@ApiTags('Users')
@ApiCookieAuth(SESSION_SECURITY)
@ApiErrors(401, 404, 500)
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Получить профиль текущего пользователя',
    description:
      'SessionGuard находит пользователя по session_id. Текущий handler возвращает запись User целиком, включая bcrypt-хеш password; это отражено в отдельной схеме ответа профиля.',
  })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'Текущая запись пользователя из БД.',
  })
  @Get('profile')
  async profile(@Req() req: CurrentUserRequest) {
    return req.user;
  }
}
