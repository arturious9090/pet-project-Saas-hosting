import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { SessionsService } from "src/sessions/sessions.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class SessionGuard implements CanActivate {
    constructor (
        private readonly sessionsService: SessionsService,
        private readonly userService: UserService
    ) {}

    async canActivate(context: ExecutionContext):Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const sessionId = this.extractSesionIdFromCookie(request)
        if (!sessionId) throw new UnauthorizedException();
        
        const session = await this.sessionsService.validateSession(sessionId)
        if (!session) throw new UnauthorizedException();

        const user = await this.userService.findById(session.userId)
        request['user'] = user
        return true 
    }

    private extractSesionIdFromCookie(request: Request): string | undefined {
        const sessionId = request.cookies['session_id']
        return sessionId ? sessionId : undefined
    }

}