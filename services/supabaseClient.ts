
import { createClient } from '@supabase/supabase-js';

// Fallback values for Blogger environment where env vars might not be injected
const FALLBACK_URL = 'https://smnkckxntclyyqfivniz.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbmtja3hudGNseXlxZml2bml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzYyNzcsImV4cCI6MjA1NjkxMjI3N30.r4X3_d8H-T0_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q_Q'; // Replace with actual key if needed, or rely on the build process

let supabaseUrl = '';
let supabaseAnonKey = '';

// 1. Try Vite's import.meta.env
try {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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
// NOTE: For security, it's better to inject these during build, but if the build 
// process strips them out, this is the only way to make it work on a static host.
if (!supabaseUrl || !supabaseAnonKey) {
  // We need the actual values here for the fallback to work.
  // If you have them, replace the FALLBACK constants above.
  // For now, we will try to use the ones that might be injected by a global window object
  // if you set them in Blogger's HTML directly.
  
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
