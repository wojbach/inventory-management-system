import { LOG_LEVELS, LogLevel } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  validateSync,
} from 'class-validator';
import { LogFormat } from '../logger/log-format.enum';
import { Environment } from '../logger/environment.enum';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  APP_NAME: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  APP_VERSION: string;

  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsOptional()
  @IsEnum(LogFormat)
  LOG_FORMAT: LogFormat = LogFormat.Default;

  @IsOptional()
  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = LOG_LEVELS[LOG_LEVELS.lastIndexOf('log')];

  @IsOptional()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9\-_]*$/, {
    message: 'SWAGGER_DOCS_URI must be a valid URL path (e.g. /api-docs)',
  })
  SWAGGER_DOCS_URI: string = '/api';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
