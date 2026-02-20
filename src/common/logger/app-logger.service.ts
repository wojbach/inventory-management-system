import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private readonly useJson: boolean;

  constructor(private readonly appConfigService: AppConfigService) {
    super();
    this.useJson = this.appConfigService.logFormat === 'json';
    this.setLogLevels(this.getLogLevels(this.appConfigService.logLevel));
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    if (!this.useJson) {
      return super.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff,
      );
    }

    let entry: Record<string, unknown>;

    if (typeof message === 'object' && message !== null) {
      const { text, ...data } = message as Record<string, unknown>;
      entry = {
        timestamp: new Date().toISOString(),
        level: logLevel,
        pid: process.pid,
        context: this.context || undefined,
        message: text || undefined,
        ...data,
      };
    } else {
      entry = {
        timestamp: new Date().toISOString(),
        level: logLevel,
        pid: process.pid,
        context: this.context || undefined,
        message,
      };
    }

    return JSON.stringify(entry) + '\n';
  }

  private getLogLevels(level: string): LogLevel[] {
    const levels: LogLevel[] = [
      'fatal',
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ];
    const index = levels.indexOf(level as LogLevel);
    return index === -1 ? ['log', 'error', 'warn'] : levels.slice(0, index + 1);
  }
}
