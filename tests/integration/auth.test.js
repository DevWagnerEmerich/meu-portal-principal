const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/database');

describe('Auth API Routes', () => {
    // Força encerramento do DB
    afterAll(async () => {
        await db.destroy();
    });

    describe('POST /api/login', () => {
        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'nonexistentuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBeOneOf([400, 401]); // Pode ser 400 (bad req) ou 401 (unauthorized)
            // Se retornar 200 é falha grave de segurança
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'useronly'
                });

            expect(res.statusCode).toEqual(400); // Bad request
        });
    });

    describe('POST /api/register', () => {
        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({
                    username: 'testvalid',
                    email: 'invalid-email',
                    password: '123'
                });

            expect(res.statusCode).toEqual(400);
            // Verifica se a resposta contém erro de validação
            expect(res.body.errors).toBeDefined();
        });
    });
});

// Custom matcher helper (since I don't have jest-extended loaded maybe, let's keep it simple or use try/catch logic if standard matchers fail, but standard standard jest has toBeOneOf? No. manually check)
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be in [${expected}]`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be in [${expected}]`,
                pass: false,
            };
        }
    },
});
