import { registerAs } from "@nestjs/config";

export default registerAs('s3', () => ({
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    keyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOIN,
    publicEndpoint: process.env.AWS_ENDPOINT_PUBLIC,
    bucket: process.env.AWS_BUCKET
}))
