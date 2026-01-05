import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Ambiente de teste - happy-dom para simular DOM sem browser
    environment: 'happy-dom',
    
    // Diretório de testes - incluir src/__tests__ e tests/unit
    include: [
      'tests/unit/**/*.spec.{js,ts}',
      'src/__tests__/**/*.test.{js,ts}'
    ],
    
    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/utils/**/*.{js,ts}',
        'src/tarkan/composables/**/*.{js,ts}',
        'src/composables/**/*.{js,ts}'
      ],
      exclude: ['node_modules', 'tests'],
      reportsDirectory: './coverage'
    },
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter
    reporters: ['verbose'],
    
    // Globals (permite usar describe/it/expect sem import)
    globals: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
