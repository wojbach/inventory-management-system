import { LOG_LEVELS, LogLevel } from '@nestjs/common';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';
import { Environment } from '../logger/environment.enum';
import { LogFormat } from '../logger/log-format.enum';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  APP_NAME: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['mongodb', 'mongodb+srv'],
    require_tld: false,
  })
  MONGO_URI: string;

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
