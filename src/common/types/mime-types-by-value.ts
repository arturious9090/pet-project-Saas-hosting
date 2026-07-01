import { MIME_TYPE_VALUES, MimeTypeValue } from "./mime-types-value";
import { MimeType } from "@prisma/client";

export const MIME_TYPE_BY_VALUE = (
    Object.entries(MIME_TYPE_VALUES) as Array<[MimeType, MimeTypeValue]>
).reduce<Record<MimeTypeValue, MimeType>>(
    (result, [prismaMimeType, mimeType]) => {
        result[mimeType] = prismaMimeType;
        return result;
    },
    {} as Record<MimeTypeValue, MimeType>,
);