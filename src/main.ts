import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import 'dotenv/config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ======= CORS GLOBAL (antes de cualquier otro middleware) =======
  app.enableCors({
    origin: 'http://localhost:3001', // <-- tu frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ======= VALIDACIÓN GLOBAL =======
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ======= SWAGGER =======
  const config = new DocumentBuilder()
    .setTitle('API Registros')
    .setDescription('Documentación de la API del sistema de lotes y registros')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'user-jwt',
    )
    .addApiKey(
      { type: 'apiKey', name: 'Authorization', in: 'header' },
      'lot-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`App listening on port ${process.env.PORT || 3000}`);
}
bootstrap();

