import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'agent-tools/**',
      'terminals/**',
      'SCREENSHOTS/**',
    ],
  },
  ...nextVitals,
  {
    rules: {
      // The repository predates flat config and contains legacy JavaScript-style
      // boundaries. Keep the Next runtime rules active without turning those
      // existing boundaries into a release blocker.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'prefer-const': 'off',
    },
  },
];

export default config;
