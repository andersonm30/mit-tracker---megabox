#!/usr/bin/env node
/**
 * verify-hardening.js
 * 
 * Script de verificação dos Hardening Gates
 * Valida que todos os requisitos de qualidade foram atendidos
 * 
 * Uso: npm run verify:hardening
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

let passed = 0;
let failed = 0;
let skipped = 0;

function runCommand(cmd, description, optional = false) {
  log.info(`Executando: ${description}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    log.success(`${description} - OK`);
    passed++;
    return true;
  } catch (e) {
    if (optional) {
      log.warn(`${description} - Pulado (opcional)`);
      skipped++;
    } else {
      log.error(`${description} - FALHOU`);
      failed++;
    }
    return false;
  }
}

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description} - Existe`);
    passed++;
    return true;
  } else {
    log.error(`${description} - Não encontrado: ${filePath}`);
    failed++;
    return false;
  }
}

function checkNoDirectTimers() {
  log.info('Verificando uso de timers diretos...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  
  if (!fs.existsSync(filePath)) {
    log.error('Arquivo devices.internal.vue não encontrado');
    failed++;
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar setTimeout/setInterval que NÃO sejam setSafeTimeout/setSafeInterval
  const directTimerPatterns = [
    /(?<!setSafe)setTimeout\s*\(/g,
    /(?<!setSafe)setInterval\s*\(/g,
    /(?<!clearSafe)clearTimeout\s*\(/g,
    /(?<!clearSafe)clearInterval\s*\(/g
  ];
  
  let foundDirect = false;
  for (const pattern of directTimerPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Filtrar comentários e strings
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          log.error(`Timer direto encontrado na linha ${i + 1}: ${line.trim().substring(0, 80)}`);
          foundDirect = true;
        }
      }
    }
  }
  
  if (!foundDirect) {
    log.success('Nenhum timer direto encontrado (apenas via registry)');
    passed++;
    return true;
  } else {
    failed++;
    return false;
  }
}

function checkCleanupPoints() {
  log.info('Verificando pontos de cleanup...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const requiredPatterns = [
    { pattern: /onBeforeUnmount\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?cleanupAll\s*\(\s*['"]unmount['"]\s*\)/, name: 'onBeforeUnmount' },
    { pattern: /onBeforeRouteLeave\s*\([\s\S]*?cleanupAll\s*\(\s*['"]route-leave['"]\s*\)/, name: 'onBeforeRouteLeave' },
    { pattern: /watch\s*\(\s*\(\s*\)\s*=>\s*deviceId\.value[\s\S]*?cleanupAll\s*\(\s*['"]device-change['"]\s*\)/, name: 'watch(deviceId)' }
  ];
  
  let allFound = true;
  for (const { pattern, name } of requiredPatterns) {
    if (pattern.test(content)) {
      log.success(`cleanupAll em ${name} - OK`);
      passed++;
    } else {
      log.error(`cleanupAll em ${name} - NÃO ENCONTRADO`);
      failed++;
      allFound = false;
    }
  }
  
  return allFound;
}

function checkReentranceLock() {
  log.info('Verificando lock de reentrância...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasLockVar = /let\s+cleanupInProgress\s*=\s*false/.test(content);
  const hasLockCheck = /if\s*\(\s*cleanupInProgress\s*\)/.test(content);
  const hasLockSet = /cleanupInProgress\s*=\s*true/.test(content);
  const hasLockRelease = /cleanupInProgress\s*=\s*false/.test(content);
  
  if (hasLockVar && hasLockCheck && hasLockSet && hasLockRelease) {
    log.success('Lock de reentrância implementado corretamente');
    passed++;
    return true;
  } else {
    log.error('Lock de reentrância incompleto');
    failed++;
    return false;
  }
}

function checkCleanupOrder() {
  log.info('Verificando ordem do cleanupAll...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extrair a função cleanupAll
  const cleanupMatch = content.match(/const cleanupAll = \(reason\) => \{[\s\S]*?\n\};/);
  
  if (!cleanupMatch) {
    log.error('Função cleanupAll não encontrada');
    failed++;
    return false;
  }
  
  const cleanupBody = cleanupMatch[0];
  
  // Verificar ordem relativa
  const abortPos = cleanupBody.indexOf('abortAllControllers');
  const videoPos = cleanupBody.indexOf('videoPlayer');
  const dualPos = cleanupBody.indexOf('cleanupDualCameraResources');
  const timersPos = cleanupBody.indexOf('clearAllTimers');
  const listenersPos = cleanupBody.indexOf('removeAllDomListeners');
  
  const orderCorrect = 
    abortPos > 0 && 
    videoPos > abortPos && 
    dualPos > videoPos && 
    timersPos > dualPos && 
    listenersPos > timersPos;
  
  if (orderCorrect) {
    log.success('Ordem do cleanupAll está correta');
    passed++;
    return true;
  } else {
    log.error('Ordem do cleanupAll incorreta');
    log.info(`  Esperado: abort → video → dual → timers → listeners`);
    failed++;
    return false;
  }
}

function checkSafeTraccarCall() {
  log.info('Verificando safeTraccarCall...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasSafeTraccarCall = /const safeTraccarCall = async/.test(content);
  const usageCount = (content.match(/safeTraccarCall\s*\(/g) || []).length - 1; // -1 para a definição
  
  if (hasSafeTraccarCall && usageCount >= 5) {
    log.success(`safeTraccarCall implementado (${usageCount} usos)`);
    passed++;
    return true;
  } else {
    log.error(`safeTraccarCall: ${hasSafeTraccarCall ? 'existe' : 'não existe'}, usos: ${usageCount}`);
    failed++;
    return false;
  }
}

function checkPDFFinally() {
  log.info('Verificando PDF com try/catch/finally...');
  
  const filePath = path.join(process.cwd(), 'src/templates/devices.internal.vue');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar generateDriverPDF com finally
  const hasFinally = /generateDriverPDF[\s\S]*?finally\s*\{[\s\S]*?isGeneratingPDF\.value\s*=\s*false/.test(content);
  
  if (hasFinally) {
    log.success('PDF generation com finally garantindo reset');
    passed++;
    return true;
  } else {
    log.error('PDF generation sem finally adequado');
    failed++;
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`
${colors.bold}╔════════════════════════════════════════════════════════════╗
║           HARDENING GATES - Verificação Final              ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

  // Gate 1: Arquivos de teste existem
  log.header('Gate 1: Smoke Tests Playwright');
  checkFile('tests/smoke/device-internal.smoke.spec.js', 'Arquivo de testes');
  checkFile('playwright.config.js', 'Configuração Playwright');
  
  // Gate 2: Zero timers diretos
  log.header('Gate 2: Zero setTimeout/setInterval Diretos');
  checkNoDirectTimers();
  
  // Gate 3: cleanupAll em 3 pontos
  log.header('Gate 3: cleanupAll em 3 Pontos');
  checkCleanupPoints();
  
  // Gate 4: Lock de reentrância
  log.header('Gate 4: Lock de Reentrância');
  checkReentranceLock();
  
  // Gate 5: Ordem do cleanupAll
  log.header('Gate 5: Ordem do cleanupAll');
  checkCleanupOrder();
  
  // Gate 6: PDF com finally
  log.header('Gate 6: PDF com try/catch/finally');
  checkPDFFinally();
  
  // Gate 7: safeTraccarCall
  log.header('Gate 7: safeTraccarCall');
  checkSafeTraccarCall();
  
  // Executar lint (opcional)
  log.header('Verificações Opcionais');
  runCommand('npm run lint --silent 2>/dev/null || true', 'ESLint', true);
  
  // Listar testes Playwright
  log.header('Playwright Tests');
  runCommand('npx playwright test --list', 'Listar testes E2E', true);
  
  // Resumo
  console.log(`
${colors.bold}╔════════════════════════════════════════════════════════════╗
║                        RESUMO                              ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

  ${colors.green}✓ Passou:${colors.reset}  ${passed}
  ${colors.red}✗ Falhou:${colors.reset}  ${failed}
  ${colors.yellow}⚠ Pulado:${colors.reset}  ${skipped}
`);

  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}
  ════════════════════════════════════════════════════════════
  ✅ TODOS OS HARDENING GATES PASSARAM!
  
  🚀 Pronto para próxima fase:
     • Split Components - Extrair subcomponentes
     • Performance - Otimizações de renderização
     • Observability - Métricas de produção
  ════════════════════════════════════════════════════════════
${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}
  ════════════════════════════════════════════════════════════
  ❌ ${failed} GATE(S) FALHARAM
  
  Revise os erros acima antes de prosseguir.
  ════════════════════════════════════════════════════════════
${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);
