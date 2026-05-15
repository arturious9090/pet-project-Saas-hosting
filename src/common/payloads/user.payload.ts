import { User } from "@prisma/client";

export type UserPyload = Omit<User, 'password'>