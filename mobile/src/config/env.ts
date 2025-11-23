/**
 * Environment configuration for BGAI mobile app
 * Contains Supabase and backend API URLs and keys
 */

const ENV = {
  dev: {
    supabaseUrl: 'http://127.0.0.1:54321',
    supabaseAnonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    backendUrl: 'http://127.0.0.1:8000',
  },
  prod: {
    // TODO: Replace with production credentials when deploying
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseAnonKey: 'your-anon-key',
    backendUrl: 'https://your-backend.com',
  },
};

// Determine which environment to use
// In the future, this can be based on __DEV__ or Constants.manifest.extra
const currentEnv = 'dev';

export const config = ENV[currentEnv];
