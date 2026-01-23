'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Se o e-mail estiver cadastrado, as instruções serão enviadas.');
            } else {
                setStatus('error');
                setMessage(data.message || 'Ocorreu um erro. Tente novamente.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar Senha</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        Digite seu e-mail para receber as instruções de redefinição.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center">
                        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
                            {message}
                        </div>
                        <Link href="/login" className="text-teal-600 hover:text-teal-500 font-medium">
                            Voltar para Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                            <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
                                {message}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                E-mail
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                required
                                placeholder="seu@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Enviando...' : 'Enviar Instruções'}
                        </button>

                        <div className="text-center mt-4">
                            <Link href="/login" className="text-sm text-teal-600 hover:text-teal-500">
                                Voltar para Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
