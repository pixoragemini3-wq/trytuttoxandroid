import { createClient } from '@supabase/supabase-js';

// Fallback values for Blogger environment where env vars might not be injected
const FALLBACK_URL = 'https://jdbqzwfxedrvizvkycrv.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkYnF6d2Z4ZWRydml6dmt5Y3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDQ0NTgsImV4cCI6MjA4ODIyMDQ1OH0.2EotM2DgMjgvg4xb7cBGcISl6u7Ae_xsF6TTsfZAGE8';

let supabaseUrl = '';
let supabaseAnonKey = '';

// 1. Try Vite's import.meta.env
try {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (e) {
  // Ignore
}

// 2. Try Node's process.env
if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
}

// 3. Fallback to hardcoded values if still empty (crucial for Blogger)
if (!supabaseUrl || !supabaseAnonKey) {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.ENV) {
    // @ts-ignore
    supabaseUrl = window.ENV.VITE_SUPABASE_URL || '';
    // @ts-ignore
    supabaseAnonKey = window.ENV.VITE_SUPABASE_ANON_KEY || '';
  }

  // Final fallback to hardcoded constants if window.ENV is also missing
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseUrl = FALLBACK_URL;
    supabaseAnonKey = FALLBACK_KEY;
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
