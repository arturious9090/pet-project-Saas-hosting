import { InjectEtcdClient } from '@globalart/nestjs-etcd';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Etcd3 } from 'etcd3';

@Injectable()
export class TraefikService {
    constructor(
        @InjectEtcdClient() private readonly etcd: Etcd3,
        private readonly config: ConfigService
    ) { }

    /**
     * Додає проєкт (сайт) у Traefik.
     * Створює:
     *  - router: правило Host + PathPrefix, entrypoint
     *  - service: вказує на S3-сумісне сховище (MinIO) як бекенд
     *  - middleware: перезаписує шлях для S3 (підставляє бакет)
     *
     * @param domain - зовнішній домен (наприклад, project123.localhost)
     * @param projectId - ID проєкту
     */
    async addProject(domain: string, projectId: string) {
        const bucket = this.config.get<string>('s3.bucket');

        // Роутер: ловить запити на домен + опціонально PathPrefix
        await this.etcd.put(`traefik/http/routers/${projectId}/rule`).value(`Host(\`${domain}\`)`);
        await this.etcd.put(`traefik/http/routers/${projectId}/entryPoints/0`).value('web');
        await this.etcd.put(`traefik/http/routers/${projectId}/service`).value(`${projectId}-service`);
        await this.etcd.put(`traefik/http/routers/${projectId}/middlewares/0`).value(`${projectId}-s3-prefix`);

        // Сервіс: проксі на S3 (MinIO)
        // Використовуємо reverse proxy на внутрішній MinIO
        await this.etcd.put(`traefik/http/services/${projectId}-service/loadBalancer/servers/0/url`).value(`http://minio:9000`);

        // Middleware: додаємо префікс бакету до шляху
        // Наприклад, запит на /index.html перетворюється на /${bucket}/users/.../index.html
        // Але краще використати AddPrefix + ReplacePathRegex для гнучкості
        await this.etcd.put(`traefik/http/middlewares/${projectId}-s3-prefix/addPrefix/prefix`).value(`/${bucket}`);
    }

    /**
     * Додає файл до проєкту в Traefik.
     * Створює middleware для перезапису шляху:
     *   Зовнішній шлях: /{filePath} (наприклад, /css/style.css)
     *   Внутрішній шлях: /{bucket}/{s3Key} (наприклад, /main-bucket/users/123/projects/abc/objects/file.css)
     *
     * @param projectId - ID проєкту
     * @param filePath - зовнішній шлях до файлу (наприклад, /index.html або /css/style.css)
     * @param s3Key - ключ файлу в S3 (наприклад, users/123/projects/abc/objects/file.html)
     */
    async addFile(projectId: string, filePath: string, s3Key: string) {
        const bucket = this.config.get<string>('s3.bucket');
        const middlewareName = `${projectId}-${this.sanitize(filePath)}`;

        // Middleware: ReplacePathRegex мапить зовнішній шлях на внутрішній S3 шлях
        // Наприклад: /index.html -> /main-bucket/users/.../file.html
        await this.etcd.put(
            `traefik/http/middlewares/${middlewareName}/replacePathRegex/regex`
        ).value(`^${filePath}$`);

        await this.etcd.put(
            `traefik/http/middlewares/${middlewareName}/replacePathRegex/replacement`
        ).value(`/${bucket}/${s3Key}`);

        // Додаємо цей middleware до роутера проєкту
        // Спочатку читаємо існуючі middleware, щоб не затерти
        const existingMiddlewares = await this.etcd.getAll().prefix(`traefik/http/routers/${projectId}/middlewares`).keys();
        const middlewareCount = existingMiddlewares.length;

        await this.etcd.put(
            `traefik/http/routers/${projectId}/middlewares/${middlewareCount}`
        ).value(middlewareName);
    }

    /**
     * Видаляє проєкт з Traefik (всі пов'язані ключі)
     */
    async removeProject(projectId: string) {
        await this.etcd.delete().prefix(`traefik/http/routers/${projectId}`);
        await this.etcd.delete().prefix(`traefik/http/services/${projectId}-service`);
        await this.etcd.delete().prefix(`traefik/http/middlewares/${projectId}-`);
    }

    /**
     * Видаляє файл з конфігурації Traefik
     */
    async removeFile(projectId: string, filePath: string) {
        const middlewareName = `${projectId}-${this.sanitize(filePath)}`;
        await this.etcd.delete().key(`traefik/http/middlewares/${middlewareName}`);

        // Видаляємо посилання на middleware з роутера
        const allMiddlewares = await this.etcd.getAll().prefix(`traefik/http/routers/${projectId}/middlewares`).strings();
        const keys = Object.keys(allMiddlewares);
        for (const key of keys) {
            if (allMiddlewares[key] === middlewareName) {
                await this.etcd.delete().key(key);
            }
        }
    }

    /**
     * Очищає спецсимволи для використання в імені middleware
     */
    private sanitize(path: string): string {
        return path
            .replace(/[^a-zA-Z0-9-_/]/g, '-')
            .replace(/\//g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
    }
}
