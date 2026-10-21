import nextVitals from 'eslint-config-next/core-web-vitals'

// Effect-based data fetching is intentional in the dashboard/admin client
// components; the React Compiler rule flags any synchronous setState in an
// effect. Revisit if these pages move to server components or a query library.
const config = [
  ...nextVitals,
  {
    ignores: ['.next/**', 'node_modules/**', 'scripts/**', 'public/**'],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
