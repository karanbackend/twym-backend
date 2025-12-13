import { NestFactory } from '@nestjs/core';
import * as dns from 'dns';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from './common/config/app.config';

async function bootstrap() {
    // Prefer IPv4 to avoid IPv6 ENETUNREACH/ETIMEDOUT with undici fetch
    try {
        // Node.js >= 18 supports controlling DNS result order
        dns.setDefaultResultOrder('ipv4first');
    } catch (e) {
        void e;
    }
    const app = await NestFactory.create(AppModule);

    // Get configuration service
    const appConfig = app.get(AppConfig);

    // Configure CORS
    if (appConfig.cors.enabled) {
        app.enableCors({
            origin: appConfig.cors.origin,
            credentials: appConfig.cors.credentials,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
            maxAge: 3600,
        });
    }

    app.setGlobalPrefix('api/v1', {
        exclude: ['/', 'api', 'api/v1'],
    });

    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
        const config = new DocumentBuilder()
            .setTitle('Twym Connect API')
            .setDescription(
                'Twym Connect API contracts and documentation.\n\n' +
                    'This documentation covers the public and internal HTTP APIs used by Twym Connect services.\n' +
                    'Use the provided JWT bearer token to authorize requests where required.',
            )
            .setVersion('1.0')
            .setContact('Twym Labs', 'https://twym.com', 'support@twym.com')
            .setLicense('UNLICENSED', '')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
            .addServer('/')
            .addTag('profiles', 'Profile management')
            .addTag('users', 'User management')
            .addTag('contacts', 'Contacts and OCR')
            .addTag('contact-forms', 'Contact forms and submissions')
            .addTag('Calendar', 'Calendar integrations')
            .build();

        const document = SwaggerModule.createDocument(app, config, {
            ignoreGlobalPrefix: false,
        });

        SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
            jsonDocumentUrl: 'api/docs/json',
            yamlDocumentUrl: 'api/docs/yaml',
        });
    }

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
