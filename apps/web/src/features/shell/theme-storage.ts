/**
 * Chave do tema no localStorage ('true' | 'false').
 *
 * Fica num módulo sem 'use client' de propósito: o script inline de app/layout.tsx
 * (Server Component) aplica o tema antes da hidratação e precisa do texto da chave. Vinda
 * de um módulo de cliente, ela chegaria ao servidor como referência de cliente, não como
 * string.
 */
export const THEME_STORAGE_KEY = 'isDarkMode';
