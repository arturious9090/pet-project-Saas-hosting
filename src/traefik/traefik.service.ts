import { InjectEtcdClient } from '@globalart/nestjs-etcd';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Etcd3 } from 'etcd3';

@Injectable()
export class TraefikService {
  private readonly backendServiceName = 'projects-backend';
  private readonly appHost = 'http://app:3000';

  constructor(
    @InjectEtcdClient() private readonly etcd: Etcd3,
    private readonly config: ConfigService,
  ) {}

  /**
   * Добавляет проект в Traefik:
   * - Router с Host-правилом на домен проекта
   * - Middleware, прокидывающий X-Project-Id в запрос
   * - Глобальный service (создаётся один раз для всех проектов)
   *
   * @param domain — FQDN проекта (например, abc123.localhost)
   * @param projectId — ID проекта (CUID)
   */
  async addProject(domain: string, projectId: string) {
    // Убедимся, что глобальный backend-сервис существует
    await this.ensureBackendService();

    // Router: правило Host
    await this.etcd
      .put(`traefik/http/routers/${projectId}/rule`)
      .value(`Host(\`${domain}\`)`);

    await this.etcd
      .put(`traefik/http/routers/${projectId}/entryPoints/0`)
      .value('web');

    await this.etcd
      .put(`traefik/http/routers/${projectId}/service`)
      .value(this.backendServiceName);

    // Middleware: прокидывает X-Project-Id в заголовок запроса
    const middlewareName = `project-${projectId}-header`;

    await this.etcd
      .put(`traefik/http/routers/${projectId}/middlewares/0`)
      .value(middlewareName);

    await this.etcd
      .put(
        `traefik/http/middlewares/${middlewareName}/headers/customrequestheaders/X-Project-Id`,
      )
      .value(projectId);
  }

  /**
   * Удаляет проект из Traefik (router + middleware)
   */
  async removeProject(projectId: string) {
    await this.etcd
      .delete()
      .prefix(`traefik/http/routers/${projectId}`);

    await this.etcd
      .delete()
      .prefix(`traefik/http/middlewares/project-${projectId}-header`);
  }

  /**
   * Создаёт глобальный backend-сервис (один на все проекты),
   * если он ещё не существует.
   */
  private async ensureBackendService() {
    const exists = await this.etcd
      .get(
        `traefik/http/services/${this.backendServiceName}/loadBalancer/servers/0/url`,
      )
      .exists();

    if (!exists) {
      await this.etcd
        .put(
          `traefik/http/services/${this.backendServiceName}/loadBalancer/servers/0/url`,
        )
        .value(this.appHost);
    }
  }
}