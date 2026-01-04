import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Ambiente de teste
    environment: 'node',
    
    // Diretório de testes
    include: ['tests/unit/**/*.spec.{js,ts}'],
    
    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**/*.{js,ts}'],
      exclude: ['node_modules', 'tests'],
      reportsDirectory: './coverage'
    },
    
    // Timeouts
    testTimeout: 5000,
    hookTimeout: 5000,
    
    // Reporter
    reporters: ['verbose'],
    
    // Globals (opcional - permite usar describe/it/expect sem import)
    globals: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
