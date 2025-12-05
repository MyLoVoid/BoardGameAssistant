import '@testing-library/react-native/build/matchers/extend-expect';

jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Valores dummy para inicializar Supabase en tests
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'supabase-anon-test-key';
process.env.EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

// Si no tienes expo-asset instalado y quieres evitar fallos de @expo/vector-icons en tests, descomenta:
// jest.mock(
//   'expo-asset',
//   () => ({ Asset: { fromModule: () => ({ uri: '' }) } }),
//   { virtual: true },
// );
