const request = require('supertest');
const app = require('../../src/server'); // Importa a aplicação Express
const db = require('../../src/database');

describe('Public API Routes', () => {
    // Fecha a conexão com o banco após todos os testes para o Jest não ficar pendurado
    afterAll(async () => {
        await db.destroy();
    });

    describe('GET /api/games/most-accessed', () => {
        it('should return 200 and a list of games', async () => {
            const res = await request(app).get('/api/games/most-accessed');

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            // A rota pode retornar array vazio se não tiver stats, então não forçamos length > 0
            // Mas verificamos se é um array
        });
    });

    describe('GET /api/health-check (Non-existent)', () => {
        it('should return 404 for non-existent routes', async () => {
            const res = await request(app).get('/api/route-that-does-not-exist');
            expect(res.statusCode).toEqual(404);
        });
    });
});
