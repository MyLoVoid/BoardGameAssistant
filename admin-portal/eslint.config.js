// admin-portal/eslint.config.js
import nextVitals from 'eslint-config-next/core-web-vitals';
import reactHooks from 'eslint-plugin-react-hooks';

const config = [
  ...nextVitals, // Spread the array directly
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default config;
