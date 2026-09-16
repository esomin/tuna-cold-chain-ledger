import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for development
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Tuna Cold Chain Ledger API')
    .setDescription('Tuna Cold Chain Blockchain Tracking API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend server listening on port ${port}`);
  console.log(`Swagger Docs available at http://localhost:${port}/api/docs or http://localhost:${port}/docs`);
}

bootstrap();
