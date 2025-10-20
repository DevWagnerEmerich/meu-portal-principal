module.exports = {
    up: async (client) => {
        console.log('Executando migração: migration_002_create_session_table.js');
        // SQL Padrão para a tabela de sessões compatível com connect-pg-simple
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user_sessions" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            ) WITH (OIDS=FALSE);
        `);
        await client.query(`
            ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "user_sessions" ("expire");
        `);
        console.log('Tabela "user_sessions" criada ou já existente.');
    }
};
