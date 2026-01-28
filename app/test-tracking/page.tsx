'use client';

import { useState } from 'react';
import { testarConversao } from '@/app/actions/checkout';

export default function TestTrackingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; eventId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimularCompra = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await testarConversao('teste@gravadormedico.com.br');
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🧪 Teste de Tracking</h1>
        <p className="text-gray-600 mb-6">
          Clique no botão abaixo para simular uma compra e testar o envio do evento para a Meta CAPI.
        </p>

        <button
          onClick={handleSimularCompra}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? '⏳ Enviando...' : '💳 Simular Compra de R$ 197'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? '✅ Sucesso!' : '❌ Falha'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Event ID:</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                {result.eventId}
              </code>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="font-semibold text-red-700">❌ Erro</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            <strong>Dica:</strong> Verifique o console do servidor para ver os logs do envio CAPI.
            O evento aparecerá no Gerenciador de Eventos do Facebook em até 20 minutos.
          </p>
        </div>
      </div>
    </div>
  );
}
