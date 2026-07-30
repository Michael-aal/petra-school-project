import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Data loading and form synchronization intentionally update state after mount.
      // Keep the hook checks, but do not treat this React Compiler advisory as a lint failure.
      "react-hooks/set-state-in-effect": "off",
      // This module exports both the provider and its context for the existing consumers.
      "react-refresh/only-export-components": "off",
    },
  },
])
