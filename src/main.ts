import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  BigInt.prototype.toJSON = function (this: bigint) {
    return this.toString();
  };
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中未定义的字段
      forbidNonWhitelisted: true, // 传了多余字段直接报错
      transform: true, // 自动类型转换
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('API 文档')
    .setDescription('英语教育系统 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'Authorization',
    )
    .addServer('http://192.168.8.37:3000', '本地服务器')
    .addServer('https://api.blazegraph.site', '生产服务器')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
