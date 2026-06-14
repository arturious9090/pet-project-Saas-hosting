import { registerAs } from "@nestjs/config";

export default registerAs('db', () => ({
    databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",

    postgresPass: process.env.POSTGRES_PASSWORD || "postgres",
    postgresUser: process.env.POSTGRES_USER || "postgres",
    postgresDb: process.env.POSTGRES_DB || "postgres"
}))