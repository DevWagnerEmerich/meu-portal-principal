'use client';

import { useEffect } from 'react';

/**
 * PortalHandshake
 * Este componente atua como uma ponte (proxy) entre o jogo em um Iframe e a API do Portal.
 * Ele resolve o problema de cookies de terceiros bloqueados pelo Chrome (SameSite=None).
 */
export function PortalHandshake() {
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Segurança: Validar a origem da mensagem se necessário
      // No BrinaBytes, permitimos mensagens de domínios confiáveis do ecossistema
      const isTrustedOrigin = event.origin === 'https://meu-portal-jogos-conteudo.vercel.app' || 
                              event.origin.endsWith('.vercel.app') || 
                              event.origin.includes('localhost');

      if (!isTrustedOrigin) return;

      const { data } = event;
      if (!data || !data.type) return;

      const source = event.source as Window;
      console.log(`[PortalHandshake] Recebeu: ${data.type}`, data);

      try {
        switch (data.type) {
          case 'BRINCABYTES_GET_USER': {
            const res = await fetch('/api/user-status');
            const userData = await res.json();
            console.log(`[PortalHandshake] Status Login:`, userData.loggedIn ? 'Logado' : 'Deslogado');
            source.postMessage({ type: 'BRINCABYTES_USER_DATA', user: userData }, event.origin);
            break;
          }

          case 'BRINCABYTES_SAVE_DATA': {
            const { gameId, key, value } = data;
            const res = await fetch('/api/game-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId, key, value })
            });
            console.log(`[PortalHandshake] Salvar ${key}:`, res.status);
            source.postMessage({ type: 'BRINCABYTES_SAVE_RESULT', success: res.ok, key }, event.origin);
            break;
          }

          case 'BRINCABYTES_LOAD_DATA': {
            const { gameId, key } = data;
            console.log(`[PortalHandshake] Carregando ${key} para ${gameId}...`);
            const res = await fetch(`/api/game-data/${gameId}/${key}`);
            const loadData = await res.json();
            console.log(`[PortalHandshake] Resultado Load ${key}:`, res.status);
            source.postMessage({ type: 'BRINCABYTES_LOAD_RESULT', success: res.ok, key, value: loadData.value }, event.origin);
            break;
          }

          case 'BRINCABYTES_LOAD_COMMUNITY_DATA': {
            const { gameId } = data;
            console.log(`[PortalHandshake] Carregando dados da comunidade para ${gameId}...`);
            const res = await fetch(`/api/game-data/community/${gameId}`);
            const communityData = await res.json();
            console.log(`[PortalHandshake] Resultado Comunidade:`, res.status, communityData.length, 'itens');
            
            source.postMessage({ 
              type: 'BRINCABYTES_LOAD_COMMUNITY_RESULT', 
              value: communityData 
            }, event.origin);
            break;
          }
        }
      } catch (error) {
        console.error('[PortalHandshake] Erro Crítico:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null; // Componente invisível (apenas lógica)
}
