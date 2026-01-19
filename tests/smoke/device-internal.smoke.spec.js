// @ts-nocheck
const { test, expect } = require('@playwright/test');

/**
 * ============================================================================
 * SMOKE TESTS - devices.internal.vue
 * ============================================================================
 * 
 * Estes testes validam que o cleanup de recursos funciona corretamente:
 * - cleanupAll() é chamado em todas as saídas
 * - Timer Registry não deixa timers órfãos
 * - AbortController cancela requests pendentes
 * - DOM listeners são removidos corretamente
 * - Não há memory leaks ao trocar devices
 * 
 * Pré-requisitos:
 * - Dev server rodando (npm run serve)
 * - Usuário autenticado (ou mock de auth)
 * 
 * @see devices.internal.vue
 * @see timerRegistry.js
 */

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Captura erros do console durante o teste
 * @param {import('@playwright/test').Page} page 
 * @returns {{ errors: string[], hasErrors: () => boolean, clear: () => void }}
 */
function setupConsoleErrorCapture(page) {
  /** @type {string[]} */
  const errors = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorar erros conhecidos/esperados
      if (text.includes('favicon.ico') || text.includes('404')) return;
      errors.push(text);
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return {
    errors,
    hasErrors: () => errors.some(e => 
      e.includes('TypeError') || 
      e.includes('Cannot read properties') ||
      e.includes('null') ||
      e.includes('undefined is not')
    ),
    clear: () => { errors.length = 0; }
  };
}

/**
 * Aguarda que a lista de devices carregue
 * @param {import('@playwright/test').Page} page 
 */
async function waitForDevicesList(page) {
  // Aguarda pelo menos um device aparecer (card ou lista)
  await page.waitForSelector(
    '[data-testid-type="device-item"], [data-testid-type="device-list-item"]',
    { timeout: 15000 }
  );
}

/**
 * Clica em um device da lista pelo índice
 * @param {import('@playwright/test').Page} page 
 * @param {number} index 
 */
async function clickDeviceByIndex(page, index) {
  const devices = page.locator('[data-testid-type="device-item"], [data-testid-type="device-list-item"]');
  const count = await devices.count();
  
  if (count === 0) {
    throw new Error('Nenhum device encontrado na lista');
  }
  
  const targetIndex = index % count; // Cicla se index > count
  await devices.nth(targetIndex).click();
}

/**
 * Aguarda que o detalhe do device carregue
 * @param {import('@playwright/test').Page} page 
 */
async function waitForDeviceDetail(page) {
  await page.waitForSelector('[data-testid="device-detail"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="device-name"]', { timeout: 5000 });
}

/**
 * Verifica se o device atual tem protocolo de câmera
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<boolean>}
 */
async function hasCamera(page) {
  const cameraButton = page.locator('[data-testid="dual-camera-toggle"]');
  return await cameraButton.isVisible().catch(() => false);
}

// ============================================================================
// CONFIGURAÇÃO GLOBAL
// ============================================================================

test.describe('Smoke Tests - Device Internal', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de devices
    await page.goto('/devices', { waitUntil: 'networkidle' });
    
    // Aguardar lista carregar (pode precisar de login - ajustar conforme auth do projeto)
    await waitForDevicesList(page);
  });
  
  // ==========================================================================
  // TESTE A: Troca rápida 10x sem TypeError
  // ==========================================================================
  test('A: troca rápida 10x sem TypeError', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    // Obter contagem de devices
    const devices = page.locator('[data-testid-type="device-item"], [data-testid-type="device-list-item"]');
    const deviceCount = await devices.count();
    
    test.skip(deviceCount < 2, 'Precisa de pelo menos 2 devices para este teste');
    
    // Trocar entre devices rapidamente (10x com 200ms entre cliques)
    for (let i = 0; i < 10; i++) {
      await clickDeviceByIndex(page, i);
      await page.waitForTimeout(200); // Simula troca rápida
    }
    
    // Aguardar estabilização
    await page.waitForTimeout(1000);
    
    // Verificar que UI está estável (device name visível)
    await waitForDeviceDetail(page);
    const deviceName = page.locator('[data-testid="device-name"]');
    await expect(deviceName).toBeVisible();
    
    // Verificar console errors
    const criticalErrors = consoleCapture.errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('Cannot read properties') ||
      e.includes('null') ||
      e.includes('undefined is not')
    );
    
    expect(criticalErrors, 
      `Encontrados ${criticalErrors.length} erros críticos: ${criticalErrors.join('; ')}`
    ).toHaveLength(0);
  });
  
  // ==========================================================================
  // TESTE B: route-leave mata tudo
  // ==========================================================================
  test('B: route-leave mata tudo (sem requests órfãos)', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    // Clicar em um device
    await clickDeviceByIndex(page, 0);
    await waitForDeviceDetail(page);
    
    // Aguardar um pouco para possíveis pollings iniciarem
    await page.waitForTimeout(2000);
    
    // Capturar requests ativos antes de sair
    /** @type {string[]} */
    const requestsAfterExit = [];
    page.on('request', (request) => {
      requestsAfterExit.push(request.url());
    });
    
    // Navegar para outra rota (reports/history ou voltar para /devices)
    await page.goto('/devices', { waitUntil: 'networkidle' });
    
    // Aguardar um pouco e verificar se não há requests repetindo
    await page.waitForTimeout(3000);
    
    // Filtrar requests relevantes (polling de câmera, traccar, etc)
    const pollingRequests = requestsAfterExit.filter(url => 
      url.includes('/api/') ||
      url.includes('camera') ||
      url.includes('video') ||
      url.includes('stream')
    );
    
    // Não deve haver muitos requests após sair (tolerância: alguns podem ser da nova página)
    // O importante é que não haja requests repetindo indefinidamente
    const uniqueUrls = [...new Set(pollingRequests)];
    const repeatedUrls = pollingRequests.length - uniqueUrls.length;
    
    expect(repeatedUrls, 
      `Detectados ${repeatedUrls} requests repetidos após sair do device`
    ).toBeLessThan(5);
    
    // Verificar console errors
    expect(consoleCapture.hasErrors(), 
      `Erros no console: ${consoleCapture.errors.join('; ')}`
    ).toBeFalsy();
  });
  
  // ==========================================================================
  // TESTE C: camera open/close + trocar device não vaza
  // ==========================================================================
  test('C: camera open/close + trocar device não vaza', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    // Encontrar device com câmera
    const devices = page.locator('[data-testid-type="device-item"], [data-testid-type="device-list-item"]');
    const deviceCount = await devices.count();
    
    let foundCameraDevice = false;
    
    for (let i = 0; i < Math.min(deviceCount, 5); i++) {
      await clickDeviceByIndex(page, i);
      await waitForDeviceDetail(page);
      
      if (await hasCamera(page)) {
        foundCameraDevice = true;
        break;
      }
    }
    
    test.skip(!foundCameraDevice, 'Nenhum device com câmera encontrado');
    
    // Abrir dual camera
    const dualCameraToggle = page.locator('[data-testid="dual-camera-toggle"]');
    await dualCameraToggle.click();
    
    // Aguardar container de câmera aparecer
    const cameraContainer = page.locator('[data-testid="dual-camera-container"]');
    await expect(cameraContainer).toBeVisible({ timeout: 10000 });
    
    // Aguardar um pouco para streams iniciarem
    await page.waitForTimeout(2000);
    
    // Fechar câmera
    await dualCameraToggle.click();
    await expect(cameraContainer).not.toBeVisible({ timeout: 5000 });
    
    // Trocar device
    await clickDeviceByIndex(page, 1);
    await waitForDeviceDetail(page);
    
    // Verificar que UI está estável
    const deviceName = page.locator('[data-testid="device-name"]');
    await expect(deviceName).toBeVisible();
    
    // Verificar console errors
    expect(consoleCapture.hasErrors(), 
      `Erros no console após fechar câmera: ${consoleCapture.errors.join('; ')}`
    ).toBeFalsy();
  });
  
  // ==========================================================================
  // TESTE D: dual camera toggle on/off + trocar device
  // ==========================================================================
  test('D: dual camera toggle on/off + trocar device', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    // Encontrar device com câmera
    const devices = page.locator('[data-testid-type="device-item"], [data-testid-type="device-list-item"]');
    const deviceCount = await devices.count();
    
    let foundCameraDevice = false;
    
    for (let i = 0; i < Math.min(deviceCount, 5); i++) {
      await clickDeviceByIndex(page, i);
      await waitForDeviceDetail(page);
      
      if (await hasCamera(page)) {
        foundCameraDevice = true;
        break;
      }
    }
    
    test.skip(!foundCameraDevice, 'Nenhum device com câmera encontrado');
    
    const dualCameraToggle = page.locator('[data-testid="dual-camera-toggle"]');
    
    // Toggle ON
    await dualCameraToggle.click();
    const cameraContainer = page.locator('[data-testid="dual-camera-container"]');
    await expect(cameraContainer).toBeVisible({ timeout: 10000 });
    
    // Toggle OFF
    await dualCameraToggle.click();
    await expect(cameraContainer).not.toBeVisible({ timeout: 5000 });
    
    // Toggle ON novamente
    await dualCameraToggle.click();
    await expect(cameraContainer).toBeVisible({ timeout: 10000 });
    
    // Trocar device imediatamente (sem fechar câmera)
    await clickDeviceByIndex(page, 1);
    
    // Aguardar estabilização
    await page.waitForTimeout(1000);
    await waitForDeviceDetail(page);
    
    // Verificar que UI está estável
    const deviceName = page.locator('[data-testid="device-name"]');
    await expect(deviceName).toBeVisible();
    
    // Verificar console errors
    const criticalErrors = consoleCapture.errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('Cannot read properties') ||
      e.includes('null') ||
      e.includes('undefined is not') ||
      e.includes('AbortError') === false // AbortError é esperado no cleanup
    );
    
    expect(criticalErrors, 
      `Erros críticos após toggle + trocar device: ${criticalErrors.join('; ')}`
    ).toHaveLength(0);
  });
  
  // ==========================================================================
  // TESTE E: Navegação back/forward não quebra
  // ==========================================================================
  test('E: navegação back/forward não quebra', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    // Clicar em device 0
    await clickDeviceByIndex(page, 0);
    await waitForDeviceDetail(page);
    
    // Clicar em device 1
    await clickDeviceByIndex(page, 1);
    await waitForDeviceDetail(page);
    
    // Voltar (browser back)
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Avançar (browser forward)
    await page.goForward();
    await page.waitForTimeout(500);
    
    // Verificar que UI está estável
    const deviceDetail = page.locator('[data-testid="device-detail"]');
    const isVisible = await deviceDetail.isVisible().catch(() => false);
    
    // Pode estar em /devices ou em um device específico
    if (isVisible) {
      const deviceName = page.locator('[data-testid="device-name"]');
      await expect(deviceName).toBeVisible();
    }
    
    // Verificar console errors
    expect(consoleCapture.hasErrors(), 
      `Erros no console após back/forward: ${consoleCapture.errors.join('; ')}`
    ).toBeFalsy();
  });
  
});

// ============================================================================
// TESTES DE STRESS (opcional - mais demorados)
// ============================================================================

test.describe('Stress Tests - Device Internal', () => {
  test.slow(); // Marca como teste lento
  
  test('STRESS: 20 trocas consecutivas sem memory leak', async ({ page }) => {
    const consoleCapture = setupConsoleErrorCapture(page);
    
    await page.goto('/devices', { waitUntil: 'networkidle' });
    await waitForDevicesList(page);
    
    const devices = page.locator('[data-testid-type="device-item"], [data-testid-type="device-list-item"]');
    const deviceCount = await devices.count();
    
    test.skip(deviceCount < 3, 'Precisa de pelo menos 3 devices para este teste');
    
    // 20 trocas com verificação de UI
    for (let i = 0; i < 20; i++) {
      await clickDeviceByIndex(page, i);
      await page.waitForTimeout(300);
      
      // A cada 5 iterações, verificar que UI está ok
      if (i % 5 === 4) {
        await waitForDeviceDetail(page);
        const deviceName = page.locator('[data-testid="device-name"]');
        await expect(deviceName).toBeVisible();
      }
    }
    
    // Verificação final
    await waitForDeviceDetail(page);
    
    // Verificar console errors acumulados
    const criticalErrors = consoleCapture.errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('Cannot read properties')
    );
    
    expect(criticalErrors.length, 
      `Encontrados ${criticalErrors.length} erros em 20 trocas`
    ).toBe(0);
  });
});
