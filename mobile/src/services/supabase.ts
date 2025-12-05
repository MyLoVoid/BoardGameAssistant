/**
 * Supabase client for BGAI mobile app
 * Configured with AsyncStorage for session persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

/**
 * Supabase client singleton
 * Uses AsyncStorage to persist auth sessions across app restarts
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
