import { UserPyload } from "../payloads/user.payload";

export interface CurrentUserRequest extends Request {
    ip: string | undefined;
    user: UserPyload
}