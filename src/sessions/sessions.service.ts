import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'node:crypto'
import { Session, SessionStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SessionsService {
    private sessionLiveTime = 5 * 24 * 60 * 60 * 1000;
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createSession(userId: string, metaData?: { ip?: string, ua?: string }) {
        return await this.prisma.session.create({
            data: {
                user: { connect: { id: userId } },
                sessionId: randomUUID(),
                expiresAt: new Date(Date.now() + this.sessionLiveTime),
                status: SessionStatus.ACTIVE,
                ip: metaData?.ip,
                ua: metaData?.ua
            }
        })
    }

    async getSession(sessionId: string): Promise<Session> {
        try {
            return await this.prisma.session.findUniqueOrThrow({
                where: { sessionId }
            })
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new UnauthorizedException('Session not found');
            }
            throw err;
        }
    }

    async revokeSession(sessionId: string) {
        try {
            return await this.prisma.session.update({
                where: { id: sessionId },
                data: { status: SessionStatus.REVOKED }
            })
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
                throw new UnauthorizedException('Session not found');
            }
            throw err;
        }
    }

    async validateSession(sessionId: string) {
        const session = await this.getSession(sessionId)
        if (new Date() < new Date(session.expiresAt) && session.status === SessionStatus.ACTIVE) {
            return session
        }
        return undefined
    }

    async getLastActiveSession(userId: string): Promise<Session | undefined> {
        const session = await this.prisma.session.findFirst({ where: { userId, status: SessionStatus.ACTIVE} })
        return session ? session : undefined
    }

    @Cron('5 * * * *')
    async checkSessions() {
        await this.prisma.session.updateMany({
            where: { expiresAt: { lt: new Date } },
            data: { status: SessionStatus.EXPIRED }
        })
    }
}
