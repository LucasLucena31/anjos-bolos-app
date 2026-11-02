import { createClient } from '@supabase/supabase-js';

// Valores vêm das variáveis de ambiente da Vercel (ou do arquivo .env.local no seu computador).
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
  // aceita a URL mesmo se vier com /rest/v1 ou barra no fim
  .replace(/\/(rest|auth|storage)\/v1\/?.*$/, '').replace(/\/+$/, '');
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase = supabaseConfigurado
  ? createClient(url, anonKey)
  : null;

// Cliente separado, sem guardar sessão: usado só para criar a conta de um
// funcionário novo sem desconectar o administrador que está cadastrando.
export const supabaseCadastro = supabaseConfigurado
  ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'ab-cadastro' } })
  : null;

// Número que recebe os avisos de bolo de festa pelo WhatsApp (opcional).
export const WHATSAPP_AVISOS = String(import.meta.env.VITE_WHATSAPP_AVISOS || '').replace(/\D/g, '');
