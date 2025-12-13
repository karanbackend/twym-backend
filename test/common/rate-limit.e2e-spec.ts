/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Rate Limiting (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should allow requests within rate limit', async () => {
        const response = await request(app.getHttpServer()).get('/').expect(200);

        // Check for rate limit headers
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should return 429 when rate limit is exceeded', async () => {
        // Get the rate limit from environment or use default
        const rateLimit = parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10);

        // Make requests up to the limit
        for (let i = 0; i < rateLimit; i++) {
            await request(app.getHttpServer()).get('/').expect(200);
        }

        // The next request should be rate limited
        const response = await request(app.getHttpServer()).get('/').expect(429);

        expect(response.body.statusCode).toBe(429);
        expect(response.body.message).toContain('ThrottlerException');
    }, 10000); // Increase timeout for this test
});
