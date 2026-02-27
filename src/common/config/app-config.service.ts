import { Injectable, LOG_LEVELS, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get appName(): string {
    return this.configService.get<string>('APP_NAME')!;
  }

  get appVersion(): string {
    return this.configService.get<string>('APP_VERSION')!;
  }

  get mongoUri(): string {
    return this.configService.get<string>('MONGO_URI')!;
  }

  get port(): number {
    return this.configService.get<number>('PORT') ?? 3000;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') ?? 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get logFormat(): string {
    return this.configService.get<string>('LOG_FORMAT') ?? 'default';
  }

  get logLevel(): string {
    return this.configService.get<LogLevel>('LOG_LEVEL') ?? LOG_LEVELS[LOG_LEVELS.lastIndexOf('log')];
  }

  get swaggerDocsUri(): string {
    return this.configService.get<string>('SWAGGER_DOCS_URI') ?? '/api';
  }

  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN')!;
  }

  getConfigEntries(): Record<string, string | number> {
    const entries: {
      key: string;
      value: string | number;
      sensitive?: boolean;
    }[] = [
      { key: 'APP_NAME', value: this.appName },
      { key: 'APP_VERSION', value: this.appVersion },
      { key: 'MONGO_URI', value: this.mongoUri, sensitive: true },
      { key: 'NODE_ENV', value: this.nodeEnv },
      { key: 'PORT', value: this.port },
      { key: 'LOG_FORMAT', value: this.logFormat },
      { key: 'LOG_LEVEL', value: this.logLevel },
      { key: 'SWAGGER_DOCS_URI', value: this.swaggerDocsUri },
      { key: 'CORS_ORIGIN', value: this.corsOrigin },
    ];

    return Object.fromEntries(entries.map(({ key, value, sensitive }) => [key, sensitive ? this.obfuscate(String(value)) : value]));
  }

  getSummary(): string {
    return JSON.stringify(this.getConfigEntries(), null, 2);
  }

  private obfuscate(value: string): string {
    if (value.length <= 4) return '****';
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
  }
}
