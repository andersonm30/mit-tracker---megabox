/**
 * useFollowDevice.ts
 * 
 * Composable para gerenciar follow de devices no mapa
 * - Watch de isFollowingId
 * - Tooltip automático com cache LRU + TTL
 * - Painel flutuante do motorista
 * - Cleanup garantido (zero memory leaks)
 * 
 * @author GitHub Copilot
 * @date 2026-01-03
 */

import { ref, watch, computed } from 'vue';

// ============================================================================
// TYPES (removidos - agora é JavaScript puro)
// ============================================================================

/**
 * @typedef {Object} Device
 * @typedef {Object} Position
 * @typedef {Object} UseFollowDeviceOptions
 * @typedef {Object} UseFollowDeviceReturn
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_UPDATE_INTERVAL = 1000; // 1 segundo
const DEFAULT_CACHE_TTL = 30000;      // 30 segundos
const DEFAULT_CACHE_MAX_SIZE = 500;   // 500 entradas

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useFollowDevice(options) {
  const {
    getDevice,
    getPosition,
    getFollowingId,
    showTooltip,
    hideTooltip,
    getMarkerPosition,
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    cacheTTL = DEFAULT_CACHE_TTL,
    cacheMaxSize = DEFAULT_CACHE_MAX_SIZE
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================
  
  const followingDeviceId = ref(null);
  const tooltipManuallyHidden = ref(false);
  const showFloatingPanel = ref(false);
  const floatingPanelDevice = ref(null);
  
  // Cache LRU com TTL
  const tooltipCache = new Map();
  let cacheHits = 0;
  let cacheMisses = 0;
  
  // Interval handle
  let tooltipUpdateInterval = null;
  
  // Computed
  const isFollowing = computed(() => followingDeviceId.value !== null);
  
  // ============================================================================
  // TOOLTIP CACHE (LRU + TTL)
  // ============================================================================
  
  /**
   * Limpa entradas expiradas do cache
   */
  const cleanExpiredCache = () => {
    const now = Date.now();
    const keysToDelete = [];
    
    tooltipCache.forEach((entry, key) => {
      if (now - entry.timestamp > cacheTTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => tooltipCache.delete(key));
  };
  
  /**
   * Limpa cache se exceder tamanho máximo (LRU: remove mais antigos)
   */
  const pruneCache = () => {
    if (tooltipCache.size <= cacheMaxSize) return;
    
    // Ordenar por timestamp (mais antigos primeiro)
    const entries = Array.from(tooltipCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remover metade dos mais antigos
    const toRemove = Math.floor(cacheMaxSize / 2);
    entries.slice(0, toRemove).forEach(([key]) => tooltipCache.delete(key));
  };
  
  /**
   * Busca no cache com TTL
   */
  const getCachedTooltip = (cacheKey) => {
    const entry = tooltipCache.get(cacheKey);
    if (!entry) {
      cacheMisses++;
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > cacheTTL) {
      tooltipCache.delete(cacheKey);
      cacheMisses++;
      return null;
    }
    
    cacheHits++;
    return entry.html;
  };
  
  /**
   * Salva no cache
   */
  const setCachedTooltip = (cacheKey, html) => {
    tooltipCache.set(cacheKey, {
      html,
      timestamp: Date.now()
    });
    
    pruneCache();
  };
  
  // ============================================================================
  // TOOLTIP BUILDER
  // ============================================================================
  
  /**
   * Constrói HTML do tooltip com cache
   */
  const buildTooltipHtml = (deviceId, device, position) => {
    // Chave de cache baseada em dados voláteis
    const cacheKey = `${deviceId}_${device.lastUpdate}_${position?.speed}_${device.status}`;
    
    // Tentar cache primeiro
    const cached = getCachedTooltip(cacheKey);
    if (cached) return cached;
    
    // Limpar cache expirado periodicamente
    if (Math.random() < 0.1) cleanExpiredCache();
    
    // Determinar cor do status de conexão
    let connectionStatusColor = '#e6a23c';
    if (device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline')) {
      connectionStatusColor = '#e6a23c';
    } else if (device.status === 'online' && position && position.speed > 6) {
      connectionStatusColor = '#409eff';
    } else if (device.status === 'online') {
      connectionStatusColor = '#67c23a';
    } else {
      connectionStatusColor = '#f56c6c';
    }
    
    // Verificar se tem motorista - REGRA PADRONIZADA
    const attrs = position.attributes ?? {};
    const driverUniqueId = attrs.driverUniqueId || null;
    const rfid = attrs.rfid || null;
    const rfidStatus = attrs.rfidStatus || null;
    
    let effectiveDriverId = driverUniqueId;
    if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
      effectiveDriverId = rfid;
    }
    if (!effectiveDriverId && device.attributes?.driverUniqueId) {
      effectiveDriverId = device.attributes.driverUniqueId;
    }
    const hasDriver = !!effectiveDriverId;
    
    // Construir HTML
    let html = `<div style="padding:10px;min-width:280px;position:relative;">
      <!-- Botões de ação -->
      <div style="position:absolute;top:6px;right:6px;display:flex;gap:2px;z-index:1000;">
        ${hasDriver ? `<!-- Botão de panel flotante do motorista -->
        <div onclick="document.dispatchEvent(new CustomEvent('openFloatingPanel', { detail: { deviceId: ${deviceId} } }));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Ver motorista">
          <i class="fas fa-id-card" style="color:white;font-size:9px;"></i>
        </div>` : ''}
        <!-- Botão de fechar -->
        <div onclick="document.dispatchEvent(new CustomEvent('hideFollowTooltip'));" style="background-color:rgba(255,255,255,0.15);width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <i class="fas fa-times" style="color:white;font-size:9px;"></i>
        </div>
      </div>
      
      <!-- Nome do dispositivo com círculo de status -->
      <div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;padding-right:20px;display:flex;align-items:center;justify-content:center;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${connectionStatusColor};margin-right:6px;flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${device.name}</span>
      </div>`;
    
    // Grid de ícones de status (simplificado para performance)
    if (position.attributes) {
      html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';
      
      // 1. Ignição
      const ignition = position.attributes.ignition;
      const ignitionColor = ignition ? '#4ade80' : '#ef4444';
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
        <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${ignition ? 'LIG' : 'DES'}</span>
      </div>`;
      
      // 2. Bloqueio
      let isBlocked = false;
      if (position.attributes.blocked !== undefined) {
        if (typeof position.attributes.blocked === 'boolean') {
          isBlocked = position.attributes.blocked;
        } else if (typeof position.attributes.blocked === 'string') {
          isBlocked = position.attributes.blocked.toLowerCase() === 'true';
        } else if (typeof position.attributes.blocked === 'number') {
          isBlocked = position.attributes.blocked !== 0;
        }
      }
      const blockedColor = isBlocked ? '#ef4444' : '#4ade80';
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${blockedColor};">
        <i class="fas ${isBlocked ? 'fa-lock' : 'fa-lock-open'}" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${isBlocked ? 'BLO' : 'DES'}</span>
      </div>`;
      
      // Adicionar mais ícones conforme necessário (bateria, sinal, etc.)
      // Por enquanto, mantendo apenas os 2 principais para performance
      
      html += '</div>';
    }
    
    // Velocidade
    const speed = Math.round((position.speed || 0) * 1.852);
    html += `<div style="font-size:13px;color:#ffffff;text-align:center;margin-top:8px;">
      <i class="fas fa-tachometer-alt" style="margin-right:6px;color:#409eff;"></i>
      <span style="font-weight:600;">${speed} km/h</span>
    </div>`;
    
    html += '</div>';
    
    // Cachear e retornar
    setCachedTooltip(cacheKey, html);
    return html;
  };
  
  // ============================================================================
  // TOOLTIP UPDATE
  // ============================================================================
  
  /**
   * Atualiza o tooltip quando o veículo está em modo seguimento
   */
  const updateFollowTooltip = () => {
    const deviceId = followingDeviceId.value;
    if (!deviceId || tooltipManuallyHidden.value) return;
    
    const device = getDevice(deviceId);
    const position = getPosition(deviceId);
    
    if (!device || !position) return;
    
    // Construir HTML do tooltip
    const tooltipHtml = buildTooltipHtml(deviceId, device, position);
    
    // Calcular posição do tooltip
    const markerPos = getMarkerPosition?.(deviceId);
    if (!markerPos || !showTooltip) return;
    
    // Offset para não cobrir o marker
    const tooltipPosition = {
      left: markerPos.x + 20,
      top: markerPos.y - 10
    };
    
    showTooltip(tooltipHtml, tooltipPosition);
  };
  
  // ============================================================================
  // FLOATING PANEL
  // ============================================================================
  
  /**
   * Atualiza o painel flutuante do motorista
   */
  const updateFloatingPanel = () => {
    if (!showFloatingPanel.value || !floatingPanelDevice.value) return;
    
    const currentFollowingId = getFollowingId();
    if (currentFollowingId && currentFollowingId !== floatingPanelDevice.value.id) {
      const updatedDevice = getDevice(currentFollowingId);
      if (updatedDevice) {
        floatingPanelDevice.value = updatedDevice;
      }
    }
  };
  
  /**
   * Fecha o tooltip manualmente
   */
  const hideTooltipManually = () => {
    tooltipManuallyHidden.value = true;
    showFloatingPanel.value = false;
    hideTooltip?.();
  };
  
  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  
  /**
   * Inicia o interval de atualização do tooltip
   */
  const startTooltipUpdates = () => {
    if (tooltipUpdateInterval) return; // Já está ativo
    
    tooltipUpdateInterval = setInterval(updateFollowTooltip, updateInterval);
    updateFollowTooltip(); // Primeira atualização imediata
  };
  
  /**
   * Para o interval de atualização do tooltip
   */
  const stopTooltipUpdates = () => {
    if (tooltipUpdateInterval) {
      clearInterval(tooltipUpdateInterval);
      tooltipUpdateInterval = null;
    }
    hideTooltip?.();
  };
  
  /**
   * Cleanup completo
   */
  const cleanup = () => {
    stopTooltipUpdates();
    tooltipCache.clear();
    followingDeviceId.value = null;
    tooltipManuallyHidden.value = false;
    showFloatingPanel.value = false;
    floatingPanelDevice.value = null;
  };
  
  // ============================================================================
  // WATCHERS
  // ============================================================================
  
  // Watch para mudanças no followingId (externo)
  watch(
    getFollowingId,
    (newId, oldId) => {
      // Guards para filtrar triggers inúteis
      if (newId === oldId) return;
      if (!newId && !oldId) return;
      
      followingDeviceId.value = newId;
      
      try {
        if (!newId && oldId) {
          // Parou de seguir
          stopTooltipUpdates();
          showFloatingPanel.value = false;
          floatingPanelDevice.value = null;  // 🔧 FIX: Resetar device ao parar follow
        } else if (newId && !oldId) {
          // Começou a seguir
          tooltipManuallyHidden.value = false;
          startTooltipUpdates();
        } else if (newId && oldId && newId !== oldId) {
          // Mudou de device
          tooltipManuallyHidden.value = false;
          floatingPanelDevice.value = null;  // 🔧 FIX: Resetar device ao mudar
          updateFloatingPanel();
          updateFollowTooltip();
        }
      } catch (error) {
        console.error('[useFollowDevice] Erro no watcher:', error);
        stopTooltipUpdates();
      }
    },
    { immediate: true }
  );
  
  // Watch para resetar tooltipManuallyHidden quando muda o device
  watch(followingDeviceId, (newId) => {
    if (newId) {
      tooltipManuallyHidden.value = false;
    }
  });
  
  // ============================================================================
  // DEBUG
  // ============================================================================
  
  const getCacheStats = () => ({
    size: tooltipCache.size,
    hits: cacheHits,
    misses: cacheMisses
  });
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Estado
    isFollowing,
    followingDeviceId,
    tooltipManuallyHidden,
    showFloatingPanel,
    floatingPanelDevice,
    
    // Métodos
    hideTooltipManually,
    updateFloatingPanel,
    cleanup,
    
    // Debug
    getCacheStats
  };
}
