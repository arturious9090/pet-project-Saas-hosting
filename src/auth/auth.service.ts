import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt'
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly sessionsService: SessionsService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async register(dto: RegisterDto) {
        let username = dto.email
        if (dto.username) username = dto.username;
        const { password, ...result } = await this.usersService.create({
            email: dto.email,
            password: await bcrypt.hash(dto.password, 10),
            userName: username
        })
        return result
    }

    async login(user: Omit<User, "password">, metaData?: { ip?: string, ua?: string }) {
            let session = await this.sessionsService.getLastActiveSession(user.id)
            if (!session) {
                session = await this.sessionsService.createSession(user.id, metaData)
            }
            return session.sessionId

    }

}
