import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { AppConfigService } from './common/config/app-config.service';
import { AppLoggerService } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const appConfigService = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);

  app.useLogger(logger);
  logger.setContext('Bootstrap');

  logger.log('Starting application...');
  logger.log('Following configuration applied:');
  logger.log(appConfigService.getConfigEntries());

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: appConfigService.isProduction,
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(), new DomainExceptionFilter());

  if (appConfigService.isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle(appConfigService.appName)
      .setDescription(`${appConfigService.appName} API`)
      .setVersion(appConfigService.appVersion)
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(appConfigService.swaggerDocsUri, app, documentFactory);
  }

  await app.listen(appConfigService.port, () => {
    logger.log(`Application is running on port ${appConfigService.port}`);
    if (appConfigService.isDevelopment) {
      logger.log(
        `Swagger docs available at: http://localhost:${appConfigService.port}${appConfigService.swaggerDocsUri}`,
      );
    }
    logger.resetContext();
  });
}
bootstrap();
