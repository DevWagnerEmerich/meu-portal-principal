/**
 * Centralização das Regras de Negócio e Constantes do Sistema
 * Isso evita "Magic Numbers" espalhados pelo código e inconsistências.
 */

const BusinessRules = {
    // Jogadas Gratuitas
    FREE_PLAYS: {
        LIMIT: 2, // Número máximo de jogadas DIÁRIAS para usuários gratuitos
    },

    // Oferta de Boas-vindas
    WELCOME_OFFER: {
        DURATION_DAYS: 7, // Duração da oferta após o cadastro
        DISCOUNT_PERCENTAGE: 0.25, // 25% de desconto (0.25)
        DISCOUNT_MULTIPLIER: 0.75, // Multiplicador para o preço final (1 - 0.25)
    },

    // Planos e Preços Base (Sem desconto)
    PLANS: {
        monthly: {
            id: 'monthly',
            title: 'Plano Mensal',
            price: 0.20,
            duration_days: 30
        },
        semiannual: {
            id: 'semiannual',
            title: 'Plano Semestral',
            price: 99.00,
            duration_days: 180
        },
        annual: {
            id: 'annual',
            title: 'Plano Anual',
            price: 179.00,
            duration_days: 365
        }
    }
};

module.exports = BusinessRules;
