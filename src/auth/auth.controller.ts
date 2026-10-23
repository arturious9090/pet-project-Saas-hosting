import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { CurrentUserRequest } from 'src/common/requests/current-user-request.interface';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors } from '../swagger/api-errors.decorator';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@ApiErrors(500)
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Войти и получить session_id cookie',
    description:
      'LocalAuthGuard проверяет email/password; затем RegisterDto валидируется ValidationPipe. Успешный ответ — текст Ok. Cookie httpOnly, maxAge 5 дней; может переиспользоваться последняя активная сессия. Неизвестный email сейчас возвращает 404, неверный пароль — 401.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description:
      'Сессия создана или переиспользована; браузер сохраняет cookie.',
    headers: {
      'Set-Cookie': {
        description:
          'Пример: session_id=<uuid>; Path=/; HttpOnly; Max-Age=432000',
        schema: { type: 'string' },
      },
    },
    content: { 'text/html': { schema: { type: 'string', example: 'Ok' } } },
  })
  @ApiErrors(400, 401, 404)
  @Post('sign-in')
  async login(
    @Req() req: Request,
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = await this.authService.login(dto, {
      ua: req.headers['user-agent'],
    });
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });
    return 'Ok';
  }

  @ApiOperation({
    summary: 'Зарегистрировать пользователя',
    description:
      'Создаёт пользователя с ролью USER и статусом PANDING. Если username не указан, userName равен email. Возвращает пользователя без password. Автоматический вход и установка cookie не выполняются.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'Пользователь создан; пароль исключён из ответа.',
  })
  @ApiErrors(400, 409)
  @Post('sign-up')
  async register(@Req() req, @Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Выйти через существующий Passport handler',
    description:
      'Текущая реализация использует LocalAuthGuard: требуется тело с email/password, одной cookie недостаточно. Затем вызывается req.logout() без callback. С Passport 0.7 этот вызов завершается 500 (req#logout requires a callback function). Handler не очищает session_id и не отзывает запись сессии в БД. Этот эндпоинт пока нельзя считать рабочим завершением cookie-сессии.',
  })
  @ApiBody({ type: LogoutDto })
  @ApiCreatedResponse({
    description:
      'Стандартный статус POST при завершении handler без возвращаемого тела; в текущей конфигурации ожидается описанная ошибка 500.',
  })
  @ApiErrors(400, 401, 404)
  @Post('sign-out')
  async logout(@Req() req) {
    return req.logout();
  }
}
