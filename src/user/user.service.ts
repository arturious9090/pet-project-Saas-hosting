import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Session, SessionStatus, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService
    ) { }
    async create(
        data: Prisma.UserCreateInput
    ): Promise<User> {
        try {
            return await this.prisma.user.create({ data })
        } catch (err) {
            if (err.code === 'P2002') throw new ConflictException('A user with that name already exists');
            throw err
        }
    }
    async update(
        id: string,
        { data }: { data: Prisma.UserUpdateInput; }
    ): Promise<User> {
        try {
            return await this.prisma.user.update({
                where: { id },
                data
            })
        } catch (err) {
            if (err.code === 'P2025') {
                throw new NotFoundException('User not found');
            }
            throw err;
        }
    }
    async delete(id: string): Promise<User> {
        try {
            return await this.prisma.user.delete({ where: { id } })
        } catch (err) {
            if (err.code === 'P2025') throw new NotFoundException('User not found');
            throw err;
        }
    }
    async findById(id: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id } })
        if (!user) throw new NotFoundException("User not found");
        return user
    }
    async list(): Promise<User[]> {
        return await this.prisma.user.findMany({})
    }
    async findByEmail(email: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { email } })
        if (!user) throw new NotFoundException("User not found");
        return user
    }
    async findByName(userName: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { userName } })
        if (!user) throw new NotFoundException("User not found");
        return user
    }

}
