/**
 * useMarkers.js
 * 
 * FASE E2.0: Composable dedicado para lógica de markers + context menu
 * 
 * RESPONSABILIDADES:
 * - markerOver: Hover/tooltip com cache LRU+TTL
 * - markerOut: Limpar tooltip
 * - markerClick: Click em marker
 * - markerContext: Context menu completo com comandos
 * 
 * HARDENING:
 * - Zero acesso direto ao Leaflet (DI puro)
 * - Debounce adaptativo (Enterprise: 80ms, padrão: 40ms)
 * - Cache LRU+TTL (500 entradas, 30s)
 * - Sanitização HTML (anti-XSS)
 * - Cooldown de comandos (5s padrão)
 * - Cleanup garantido (idempotente)
 * 
 * @param {Object} options - Dependências injetadas
 * @param {Object} options.store - Vuex store
 * @param {Object} options.router - Vue Router
 * @param {Object} options.mapApi - useMapInteraction API
 * @param {Object} options.followApi - useFollowDevice API
 * @param {Object} options.guards - mapGuards
 * @param {Object} options.env - { isEnterprise, debugFlag }
 * @param {Object} options.ui - { editDevice, editShare, linkObjects, logObjects, commandModal, sliderConfirm, contextMenu }
 * @param {Object} options.utils - { KT, sanitize, formatters }
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { sanitizeText, sanitizeAddress, sanitizeDriverName } from '../utils/sanitize';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBOUNCE_ENTERPRISE = 80; // ms
const DEBOUNCE_STANDARD = 40; // ms
const CACHE_MAX_SIZE = 500;
const CACHE_TTL = 30000; // 30s
const COMMAND_COOLDOWN = 5000; // 5s

// ============================================================================
// DEBUG HARNESS (DEV-ONLY) - FASE E2.1 GATE 2
// ============================================================================

/**
 * Verifica se debug de markers está ativo
 * Prioridade: localStorage > query param > env
 * Em produção: sempre false
 */
const isDebugMarkersEnabled = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return false;
  }
  
  try {
    // 1. localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('DEBUG_MARKERS');
      if (stored === '1' || stored === 'true') return true;
    }
    
    // 2. Query param
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('DEBUG_MARKERS') === '1') return true;
    }
    
    // 3. Env (webpack/vite)
    if (typeof process !== 'undefined' && process.env && process.env.VUE_APP_DEBUG_MARKERS === '1') {
      return true;
    }
  } catch (error) {
    // Silenciosamente falha se ambiente não suporta
  }
  
  return false;
};

/**
 * Helper de debug com rate limit
 * Evita spam: máximo 1 log por label a cada 500ms
 */
const debugMarkerState = {
  enabled: false,
  lastLog: {}, // { label: timestamp }
  rateLimit: 500 // ms
};

const devMark = (label, payload) => {
  if (!debugMarkerState.enabled) return;
  
  const now = Date.now();
  const lastTime = debugMarkerState.lastLog[label] || 0;
  
  if (now - lastTime < debugMarkerState.rateLimit) {
    return; // Rate limited
  }
  
  debugMarkerState.lastLog[label] = now;
  
  // Log com prefixo identificável
  console.log(`[🔍 MARKERS DEBUG] ${label}:`, payload);
};

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useMarkers(options) {
  const {
    store,
    router,
    mapApi,
    followApi,
    runtimeApi,
    env = {},
    ui = {},
    utils = {}
  } = options;
  
  // Validar runtimeApi (DI obrigatório)
  if (!runtimeApi) {
    throw new Error('Runtime API não disponível. Recarregue a página.');
  }
  
  const { KT } = utils;
  
  // GATE 2: Ativar debug DEV-only
  debugMarkerState.enabled = isDebugMarkersEnabled();
  if (debugMarkerState.enabled) {
    console.log('[🔍 MARKERS DEBUG] ✅ Debug mode ENABLED');
    console.log('[🔍 MARKERS DEBUG] Para desabilitar: localStorage.removeItem("DEBUG_MARKERS")');
  }
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  // Cache LRU+TTL para tooltips
  const tooltipCache = new Map();
  const cacheTimestamps = new Map();
  
  // Cooldown de comandos
  const commandCooldowns = new Map();
  
  // Debounce timer
  let hoverDebounceTimer = null;
  
  // Disposed flag
  let disposed = false;
  
  // ============================================================================
  // CACHE MANAGEMENT (LRU+TTL)
  // ============================================================================
  
  /**
   * Limpa entradas antigas do cache (LRU)
   */
  const pruneCache = () => {
    if (tooltipCache.size <= CACHE_MAX_SIZE) return;
    
    // Remover primeiras 250 entradas (FIFO simplificado)
    const keysToDelete = Array.from(tooltipCache.keys()).slice(0, 250);
    keysToDelete.forEach(key => {
      tooltipCache.delete(key);
      cacheTimestamps.delete(key);
    });
  };
  
  /**
   * Verifica se cache é válido (TTL)
   */
  const isCacheValid = (key) => {
    if (!cacheTimestamps.has(key)) return false;
    
    const timestamp = cacheTimestamps.get(key);
    const now = Date.now();
    
    return (now - timestamp) < CACHE_TTL;
  };
  
  /**
   * Get do cache com validação TTL
   */
  const getCached = (key) => {
    if (!isCacheValid(key)) {
      tooltipCache.delete(key);
      cacheTimestamps.delete(key);
      return null;
    }
    
    return tooltipCache.get(key);
  };
  
  /**
   * Set no cache com timestamp
   */
  const setCache = (key, value) => {
    pruneCache();
    tooltipCache.set(key, value);
    cacheTimestamps.set(key, Date.now());
  };
  
  // ============================================================================
  // COOLDOWN MANAGEMENT
  // ============================================================================
  
  /**
   * Verifica se comando está em cooldown
   */
  const isInCooldown = (deviceId, commandType) => {
    const key = `${deviceId}:${commandType}`;
    if (!commandCooldowns.has(key)) return false;
    
    const lastCommandTime = commandCooldowns.get(key);
    const now = Date.now();
    const elapsed = now - lastCommandTime;
    
    if (elapsed < COMMAND_COOLDOWN) {
      const remaining = Math.ceil((COMMAND_COOLDOWN - elapsed) / 1000);
      return remaining;
    }
    
    // Cooldown expirado, limpar
    commandCooldowns.delete(key);
    return false;
  };
  
  /**
   * Registra comando executado
   */
  const registerCommand = (deviceId, commandType) => {
    const key = `${deviceId}:${commandType}`;
    commandCooldowns.set(key, Date.now());
  };
  
  // ============================================================================
  // TOOLTIP BUILDER
  // ============================================================================
  
  /**
   * Constrói HTML do tooltip (DARK style profissional)
   * @param {number} deviceId
   * @param {Object} device
   * @param {Object} position
   * @param {string} connectionStatusColor
   * @returns {string} HTML sanitizado
   */
  const buildTooltipHtml = (deviceId, device, position, connectionStatusColor) => {
    // Gerar cache key
    const cacheKey = `${deviceId}_${device.lastUpdate}_${position?.speed}_${device.status}`;
    
    // Verificar cache
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    // Sanitizar nome do device
    const deviceName = sanitizeText(device.name);
    
    // Tooltip DARK com estilo profissional
    let html = `<div style="padding:10px;min-width:260px;background:rgba(0,0,0,0.88);border-radius:8px;">`;
    
    // Header: Nome com círculo de status
    html += `<div style="font-weight:bold;color:#ffffff;text-align:center;font-size:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${connectionStatusColor};margin-right:6px;flex-shrink:0;"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${deviceName}</span>
    </div>`;
    
    if (position) {
      const speed = Math.round((position.speed || 0) * 1.852);
      const ignition = position.attributes?.ignition;
      const sat = position.attributes?.sat || position.attributes?.satellites || 0;
      const battery = position.attributes?.battery || position.attributes?.batteryLevel;
      const power = position.attributes?.power;
      const fuel = position.attributes?.fuel || position.attributes?.fuelLevel;
      
      // Detectar bloqueio de forma consistente
      let isBlocked = false;
      if (position.attributes?.blocked !== undefined) {
        if (typeof position.attributes.blocked === 'boolean') {
          isBlocked = position.attributes.blocked;
        } else if (typeof position.attributes.blocked === 'string') {
          isBlocked = position.attributes.blocked.toLowerCase() === 'true';
        } else if (typeof position.attributes.blocked === 'number') {
          isBlocked = position.attributes.blocked !== 0;
        }
      }
      
      // Grid DARK de 7 ícones em linha
      html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">';
      
      // 1. Ignição
      const ignitionColor = ignition ? '#4ade80' : '#ef4444';
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${ignitionColor};">
        <i class="fas fa-key" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${ignition ? 'LIG' : 'DES'}</span>
      </div>`;
      
      // 2. Bloqueio
      const blockedColor = isBlocked ? '#ef4444' : '#4ade80';
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${blockedColor};">
        <i class="fas ${isBlocked ? 'fa-lock' : 'fa-lock-open'}" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:10px;text-align:center;color:#ffffff;">${isBlocked ? 'BLO' : 'DES'}</span>
      </div>`;
      
      // 3. Bateria do veículo (power)
      let powerColor = '#94a3b8';
      let powerValue = 'N/A';
      if (power !== undefined && power !== null) {
        const powerV = parseFloat(power);
        powerValue = powerV.toFixed(1) + 'v';
        powerColor = powerV < 11.5 ? '#ef4444' : (powerV < 12.5 ? '#f59e0b' : '#4ade80');
      }
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${powerColor};">
        <i class="fas fa-car-battery" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${powerValue}</span>
      </div>`;
      
      // 4. Bateria interna
      let batteryColor = '#94a3b8';
      let batteryValue = 'N/A';
      let batteryIcon = 'fas fa-battery-empty';
      if (battery !== undefined && battery !== null) {
        const batteryVal = parseFloat(battery);
        if (batteryVal > 100) {
          // É voltagem
          batteryValue = batteryVal.toFixed(1) + 'v';
          batteryColor = batteryVal < 3.2 ? '#ef4444' : (batteryVal < 3.7 ? '#f59e0b' : '#4ade80');
          if (batteryVal >= 4.0) batteryIcon = 'fas fa-battery-full';
          else if (batteryVal >= 3.7) batteryIcon = 'fas fa-battery-three-quarters';
          else if (batteryVal >= 3.5) batteryIcon = 'fas fa-battery-half';
          else if (batteryVal >= 3.2) batteryIcon = 'fas fa-battery-quarter';
          else batteryIcon = 'fas fa-battery-empty';
        } else {
          // É porcentagem
          batteryValue = Math.round(batteryVal) + '%';
          batteryColor = batteryVal < 30 ? '#ef4444' : (batteryVal < 70 ? '#f59e0b' : '#4ade80');
          if (batteryVal >= 90) batteryIcon = 'fas fa-battery-full';
          else if (batteryVal >= 70) batteryIcon = 'fas fa-battery-three-quarters';
          else if (batteryVal >= 40) batteryIcon = 'fas fa-battery-half';
          else if (batteryVal >= 10) batteryIcon = 'fas fa-battery-quarter';
          else batteryIcon = 'fas fa-battery-empty';
        }
      }
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${batteryColor};">
        <i class="${batteryIcon}" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${batteryValue}</span>
      </div>`;
      
      // 5. Combustível
      let fuelColor = '#94a3b8';
      let fuelValue = 'N/A';
      if (fuel !== undefined && fuel !== null) {
        const fuelVal = parseFloat(fuel);
        fuelValue = Math.round(fuelVal) + 'L';
        fuelColor = fuelVal < 25 ? '#ef4444' : (fuelVal < 50 ? '#f59e0b' : '#4ade80');
      }
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fuelColor};">
        <i class="fas fa-gas-pump" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${fuelValue}</span>
      </div>`;
      
      // 6. Velocidade
      const speedColor = speed > 0 ? '#4ade80' : '#94a3b8';
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${speedColor};">
        <i class="fas fa-tachometer-alt" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${speed}km</span>
      </div>`;
      
      // 7. Satélites
      const satVal = parseInt(sat);
      const satellitesColor = satVal < 4 ? '#ef4444' : (satVal < 8 ? '#f59e0b' : '#4ade80');
      html += `<div style="background:rgba(255,255,255,0.15);border-radius:4px;width:30px;height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${satellitesColor};">
        <i class="fas fa-satellite" style="margin-bottom:1px;font-size:14px;"></i>
        <span style="font-size:9px;text-align:center;color:#ffffff;">${satVal || 'N/A'}</span>
      </div>`;
      
      html += '</div>'; // Fecha grid
      
      // Endereço (sanitizado)
      if (position.address) {
        const address = sanitizeAddress(position);
        const addressShort = address.length > 45 ? address.substring(0, 45) + '...' : address;
        html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;">
          <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${addressShort}
        </div>`;
      } else if (position.latitude && position.longitude) {
        html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;">
          <i class="fas fa-map-marker-alt" style="margin-right:4px;color:#60a5fa;"></i>${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
        </div>`;
      }
      
      // Motorista (sanitizado)
      const driverUniqueId = position.attributes?.driverUniqueId || device.attributes?.driverUniqueId;
      if (driverUniqueId) {
        const driverObj = store.getters['drivers/getDriverByUniqueId']?.(driverUniqueId);
        const driverName = driverObj ? sanitizeDriverName(driverObj) : sanitizeText(driverUniqueId);
        html += `<div style="color:#ffffff;font-size:9px;margin-bottom:6px;text-align:center;">
          <i class="fas fa-user" style="margin-right:4px;color:#34d399;"></i>${driverName}
        </div>`;
      }
      
      // Linha inferior: Data/hora, ângulo, estado
      const lastUpdate = device.lastUpdate ? new Date(device.lastUpdate) : null;
      const course = position.course;
      const deviceState = device.attributes?.['device.state'];
      const isAdmin = store.state.auth.user?.administrator;
      
      let bottomLine = '';
      
      // Data/hora
      if (lastUpdate) {
        const formattedDate = lastUpdate.toLocaleDateString() + ' ' + lastUpdate.toLocaleTimeString();
        bottomLine += `<i class="fas fa-clock" style="color:#a78bfa;margin-right:4px;"></i>${formattedDate} `;
      }
      
      // Ângulo/direção
      if (course !== undefined && course !== null) {
        const angle = Math.round(course);
        const direction = angle >= 0 && angle <= 180 ? 'N' : 'S';
        bottomLine += `<i class="fas fa-compass" style="color:#fbbf24;margin-left:8px;margin-right:4px;"></i>${angle}°${direction} `;
      }
      
      // Estado (admin only, sanitizado)
      if (isAdmin && deviceState) {
        let stateIcon = '';
        let stateColor = '';
        let stateText = sanitizeText(deviceState);
        switch (deviceState) {
          case 'installed':
            stateText = 'Instalado';
            stateIcon = 'fa-check-circle';
            stateColor = '#67c23a';
            break;
          case 'in_service':
            stateText = 'Em Serviço';
            stateIcon = 'fa-tools';
            stateColor = '#f59e0b';
            break;
          case 'in_stock':
            stateText = 'Estoque';
            stateIcon = 'fa-box';
            stateColor = '#6b7280';
            break;
          case 'with_failures':
            stateText = 'Com Falhas';
            stateIcon = 'fa-exclamation-triangle';
            stateColor = '#ef4444';
            break;
          case 'company':
            stateText = 'Empresa';
            stateIcon = 'fa-building';
            stateColor = '#3b82f6';
            break;
          case 'withdrawn':
            stateText = 'Retirado';
            stateIcon = 'fa-archive';
            stateColor = '#dc2626';
            break;
          default:
            stateIcon = 'fa-info-circle';
            stateColor = '#94a3b8';
        }
        bottomLine += `<i class="fas ${stateIcon}" style="color:${stateColor};margin-left:8px;margin-right:4px;"></i>${stateText}`;
      }
      
      if (bottomLine) {
        html += `<div style="color:#ffffff;font-size:10px;margin-bottom:6px;text-align:center;">
          ${bottomLine}
        </div>`;
      }
    }
    
    html += `</div>`;
    
    // Armazenar no cache
    setCache(cacheKey, html);
    return html;
  };
  
  // ============================================================================
  // MARKER HANDLERS (HOVER/OUT/CLICK)
  // ============================================================================
  
  /**
   * Hover sobre marker (debounced + cached)
   * @param {Event|number} e - Evento Leaflet ou deviceId
   */
  const markerOver = (e) => {
    if (disposed) return;
    
    // Cancelar debounce anterior
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer);
    }
    
    // Debounce adaptativo
    const delay = env.isEnterprise ? DEBOUNCE_ENTERPRISE : DEBOUNCE_STANDARD;
    
    hoverDebounceTimer = setTimeout(() => {
      try {
        const deviceId = (e.target) ? e.target.options.id : e;
        const device = store.getters['devices/getDevice'](deviceId);
        const position = store.getters['devices/getPosition'](deviceId);
        
        if (!device) return;
        
        const markPoint = mapApi.latLngToContainerPoint(e.target?._latlng);
        if (!markPoint) return;
        
        const left = markPoint.x + (router.currentRoute.value.meta.shown ? 553 : 73);
        const top = markPoint.y;
        
        // Determinar cor do status de conexão
        let connectionStatusColor = '#e6a23c';
        if (device.lastUpdate === null || (device.status !== 'online' && device.status !== 'offline')) {
          connectionStatusColor = '#e6a23c'; // amarelo - desconhecido
        } else if (device.status === 'online' && position && position.speed > 6) {
          connectionStatusColor = '#409eff'; // azul - movendo
        } else if (device.status === 'online') {
          connectionStatusColor = '#67c23a'; // verde - online parado
        } else {
          connectionStatusColor = '#f56c6c'; // vermelho - offline
        }
        
        // Usar cache quando possível
        const html = buildTooltipHtml(deviceId, device, position, connectionStatusColor);
        
        window.$showTip({ left: left + 'px', top: (top) + 'px' }, html, true);
      } catch (err) {
        console.warn('[useMarkers] markerOver error:', err);
      }
    }, delay);
  };
  
  /**
   * Mouse sai do marker
   */
  const markerOut = () => {
    if (disposed) return;
    
    devMark('markerOut', { action: 'hideTooltip' });
    
    // Cancelar debounce pendente
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer);
      hoverDebounceTimer = null;
    }
    
    window.$hideTip();
  };
  
  /**
   * Click no marker
   * @param {Event|number} e - Evento Leaflet ou deviceId
   */
  const markerClick = (e) => {
    if (disposed) return;
    
    try {
      const deviceId = (e.target) ? e.target.options.id : e;
      const device = store.getters['devices/getDevice'](deviceId);
      
      devMark('markerClick', { deviceId, deviceName: device?.name });
      
      router.push('/devices/' + deviceId);
      store.commit("devices/setFollow", deviceId);
      
      // Trazer marker para frente
      if (device?.icon) {
        const marker = Array.isArray(device.icon) ? device.icon[0] : device.icon;
        if (marker?.bringToFront) {
          marker.bringToFront();
        }
      }
      
      // Fly to device (via mapApi)
      const position = store.getters["devices/getPosition"](device.id);
      const zoom = store.state.server.serverInfo?.attributes?.['web.selectZoom'] ?? 17;
      
      if (position) {
        mapApi.flyTo(
          position.latitude,
          position.longitude,
          zoom,
          { animate: true, duration: 0.8 }
        );
      }
    } catch (err) {
      console.warn('[useMarkers] markerClick error:', err);
    }
  };
  
  // ============================================================================
  // CONTEXT MENU
  // ============================================================================
  
  /**
   * markerContext - Abre menu de contexto ao clicar com botão direito
   * @param {MouseEvent|Object} evt - Evento de contexto ou objeto com originalEvent
   * @param {number|string} deviceIdParam - ID do dispositivo (opcional se evt.target.options.id existe)
   */
  const markerContext = async (evt, deviceIdParam) => {
    if (disposed) return false;
    
    try {
      // Extrair deviceId de múltiplas fontes
      let deviceId = deviceIdParam;
      if (!deviceId && evt && evt.target && evt.target.options && evt.target.options.id) {
        deviceId = evt.target.options.id;
      }

      if (!deviceId) {
        console.warn('[markerContext] DeviceId não encontrado');
        return false;
      }

      // Validação defensiva: device e position
      const device = store.getters["devices/getDevice"](deviceId);
      
      devMark('markerContext', { deviceId, deviceName: device?.name, status: device?.status });
      
      if (!device) {
        console.warn('[markerContext] Device não encontrado:', deviceId);
        return false;
      }

      const position = store.getters["devices/getPosition"](deviceId);
      if (!position) {
        console.warn('[markerContext] Position não encontrada para device:', deviceId);
        return false;
      }

      const user = store.state.auth || {};
      let availableSaved = [];
      let commands = [];

      // === SEÇÃO: Comandos Traccar ===
      if (device.status !== 'online') {
        commands.push({
          text: KT('actions.offline'),
          cb: () => {
            ElMessageBox.confirm(
              KT('actions.offline_message', device),
              'Warning',
              {
                confirmButtonText: KT('OK'),
                cancelButtonText: KT('Cancel'),
                type: 'warning',
              }
            ).then(() => {
              console.log('[markerContext] Usuário confirmou ação offline');
            }).catch(() => {
              ElMessage.error(KT('userCancel'));
            });
          }
        });
      } else {
        try {
          const response = await runtimeApi.getTypeCommands(deviceId);
          const availableTypesCommand = response.data || [];

          availableTypesCommand.forEach((c) => {
            const commandType = c.type;
            commands.push({
              text: KT('actions.' + commandType),
              cb: () => {
                // Verificar cooldown ANTES de executar
                const cooldownRemaining = isInCooldown(deviceId, commandType);
                
                if (cooldownRemaining > 0) {
                  const seconds = Math.ceil(cooldownRemaining / 1000);
                  ElMessage.warning(`Aguarde ${seconds}s para reenviar este comando.`);
                  return;
                }

                ElMessageBox.confirm(
                  KT('device.confirm_command', device),
                  'Warning',
                  {
                    confirmButtonText: KT('OK'),
                    cancelButtonText: KT('Cancel'),
                    type: 'warning',
                  }
                ).then(() => {
                  runtimeApi.sendCommand({ deviceId: deviceId, type: commandType });
                  registerCommand(deviceId, commandType);
                  ElNotification({
                    title: KT('success'),
                    message: KT('device.command_sent'),
                    type: 'success',
                  });
                }).catch(() => {
                  ElMessage.error(KT('userCancel'));
                });
              }
            });
          });

          const savedResponse = await runtimeApi.getAvailableCommands(deviceId);
          availableSaved = savedResponse.data || [];

          if (commands.length > 0 && availableSaved.length > 0) {
            commands.push({ text: 'separator' });
          }

          availableSaved.forEach((c) => {
            const commandType = c.type || 'custom';
            commands.push({
              text: sanitizeText(c.description || 'Comando'),
              cb: () => {
                // Verificar cooldown para comandos salvos
                const cooldownRemaining = isInCooldown(deviceId, commandType);
                
                if (cooldownRemaining > 0) {
                  const seconds = Math.ceil(cooldownRemaining / 1000);
                  ElMessage.warning(`Aguarde ${seconds}s para reenviar este comando.`);
                  return;
                }

                ElMessageBox.confirm(
                  KT('device.confirm_command', device),
                  'Warning',
                  {
                    confirmButtonText: KT('OK'),
                    cancelButtonText: KT('Cancel'),
                    type: 'warning',
                  }
                ).then(() => {
                  runtimeApi.sendCommand({ ...c, ...{ deviceId: deviceId } });
                  registerCommand(deviceId, commandType);
                  ElNotification({
                    title: KT('success'),
                    message: KT('device.command_sent'),
                    type: 'success',
                  });
                }).catch(() => {
                  ElMessage.error(KT('userCancel'));
                });
              }
            });
          });
        } catch (error) {
          console.error('[markerContext] Erro ao buscar comandos:', error);
        }
      }

      // === SEÇÃO: Menu Principal ===
      let tmp = [];

      // Detalhes
      tmp.push({
        text: KT('device.details'),
        icon: 'fas fa-info-circle',
        cb: () => {
          if (router) {
            router.push('/devices/' + deviceId);
          }
        }
      });

      // Zoom
      tmp.push({
        text: KT('device.zoom'),
        icon: 'fas fa-search-plus',
        cb: () => {
          if (mapApi && mapApi.flyTo && position) {
            mapApi.flyTo([position.latitude, position.longitude], 17, { animate: true, duration: 1 });
          }
        }
      });

      // Follow/Unfollow
      if (store.state.devices && store.state.devices.isFollowingId === deviceId) {
        tmp.push({
          text: KT('device.unfollow'),
          icon: 'fas fa-eye-slash',
          cb: () => {
            if (followApi && followApi.hideTooltip) {
              followApi.hideTooltip();
            }
            store.commit("devices/setFollow", 0);

            // Desactivar Street View si está activado
            if (store.state.devices.streetview) {
              store.dispatch("devices/toggleStreet");
            }
          }
        });
      } else {
        tmp.push({
          text: KT('device.follow'),
          icon: 'fas fa-eye',
          cb: () => {
            store.commit("devices/setFollow", deviceId);
            
            if (mapApi && mapApi.flyTo && position) {
              mapApi.flyTo([position.latitude, position.longitude], 17, { animate: true, duration: 1 });
            }

            // Activar Street View si hay token de Google disponible
            const googleApiKey = store.getters['server/getAttribute']('google_api');
            if (googleApiKey && googleApiKey.trim() !== '') {
              if (!store.state.devices.streetview) {
                store.dispatch("devices/toggleStreet");
              }
            }
          }
        });
      }

      // Trail/Untrail
      if (store.state.devices && store.state.devices.trail === deviceId) {
        tmp.push({
          text: KT('device.untrail'),
          icon: 'fas fa-route',
          cb: () => {
            store.commit("devices/setTrail", false);
          }
        });
      } else {
        tmp.push({
          text: KT('device.trail'),
          icon: 'fas fa-map-signs',
          cb: () => {
            store.commit("devices/setTrail", deviceId);
            if (mapApi && mapApi.flyTo && position) {
              mapApi.flyTo([position.latitude, position.longitude], 17, { animate: true, duration: 1 });
            }
          }
        });
      }

      // === SEÇÃO: Abrir em mapas externos ===
      let shareOpen = [];
      shareOpen.push({
        text: KT('device.openMaps'),
        icon: 'fas fa-map-marked-alt',
        cb: () => {
          const elm = document.createElement("a");
          elm.target = "_blank";
          elm.href = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
          document.body.appendChild(elm);
          elm.click();
          document.body.removeChild(elm);
        }
      });

      shareOpen.push({
        text: KT('device.openStreet'),
        icon: 'fas fa-street-view',
        cb: () => {
          const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
          const elm = document.createElement("a");
          elm.target = "_blank";
          elm.href = link;
          document.body.appendChild(elm);
          elm.click();
        }
      });

      tmp.push({
        text: KT('device.openExternal'),
        icon: 'fas fa-external-link-alt',
        submenu: shareOpen
      });

      // === SEÇÃO: Compartilhar ===
      let shares = [];

      if (store.getters.advancedPermissions && store.getters.advancedPermissions(25)) {
        shares.push({
          text: KT('device.shareLink'),
          icon: 'fas fa-link',
          cb: () => {
            if (ui.editShare && ui.editShare.newShare) {
              ui.editShare.newShare(deviceId);
            }
          }
        });
      }

      shares.push({
        text: KT('device.shareMaps'),
        icon: 'fas fa-map-pin',
        cb: () => {
          const url = 'http://maps.google.com/maps?q=loc:' + position.latitude + "," + position.longitude;
          if (navigator.share) {
            devMark('share', { method: 'native', url, type: 'maps' });
            
            navigator.share({
              title: sanitizeText(device.name),
              url: url
            }).then(() => {
              console.log('[Share] Compartilhamento realizado com sucesso');
            }).catch(console.error);
          } else {
            devMark('share', { method: 'clipboard', url, type: 'maps' });
            
            const elm = document.createElement("input");
            elm.value = url;
            document.body.appendChild(elm);
            elm.select();
            document.execCommand("copy");
            document.body.removeChild(elm);
            ElMessage.success('Copiado para área de transferência');
          }
        }
      });

      shares.push({
        text: KT('device.shareStreet'),
        icon: 'fas fa-road',
        cb: () => {
          const link = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + position.latitude + ',' + position.longitude + '&heading=' + position.course + '&pitch=10&fov=80';
          if (navigator.share) {
            devMark('share', { method: 'native', url: link, type: 'street' });
            
            navigator.share({
              title: sanitizeText(device.name),
              url: link
            }).then(() => {
              console.log('[Share] Compartilhamento de street view realizado');
            }).catch(console.error);
          } else {
            devMark('share', { method: 'clipboard', url: link, type: 'street' });
            
            const elm = document.createElement("input");
            elm.value = link;
            document.body.appendChild(elm);
            elm.select();
            document.execCommand("copy");
            document.body.removeChild(elm);
            ElMessage.success('Copiado para área de transferência');
          }
        }
      });

      tmp.push({
        text: KT('device.share'),
        icon: 'fas fa-share-alt',
        submenu: shares
      });

      let addSep = true;

      // === SEÇÃO: Âncora (Anchor) ===
      if (store.getters.advancedPermissions && store.getters.advancedPermissions(9)) {
        if (addSep) {
          tmp.push({ text: 'separator' });
          addSep = false;
        }
        const isAnchored = store.getters['geofences/isAnchored'] && store.getters['geofences/isAnchored'](deviceId);
        tmp.push({
          text: KT((isAnchored) ? 'actions.anchorDisable' : 'actions.anchorEnable'),
          icon: 'fas fa-anchor',
          cb: () => {
            // actAnchor precisa ser chamado via store action ou callback
            if (ui.actAnchor) {
              ui.actAnchor(deviceId);
            } else {
              console.warn('[markerContext] actAnchor não disponível em ui callbacks');
            }
          }
        });
      }

      // === SEÇÃO: Lock/Unlock com SliderConfirm ===
      if (position.attributes?.blocked && store.getters.advancedPermissions && store.getters.advancedPermissions(11)) {
        if (addSep) {
          tmp.push({ text: 'separator' });
          addSep = false;
        }
        tmp.push({
          disabled: (device.status !== 'online'),
          icon: 'fas fa-unlock',
          text: KT('device.unlock'),
          cb: () => {
            // Verificar cooldown para unlock
            const cooldownRemaining = isInCooldown(deviceId, 'engineResume');
            
            if (cooldownRemaining > 0) {
              const seconds = Math.ceil(cooldownRemaining / 1000);
              
              devMark('cooldown', {
                deviceId,
                commandType: 'engineResume',
                remainingMs: cooldownRemaining,
                remainingSec: seconds
              });
              
              ElMessage.warning(`Aguarde ${seconds}s para reenviar este comando.`);
              return;
            }

            // Usar SliderConfirmModal
            if (ui.sliderConfirm) {
              ui.sliderConfirm({
                title: KT('device.unlock') || 'Desbloquear Veículo',
                deviceName: sanitizeText(device.name),
                message: KT('device.confirm_unlock', device) || `Deseja desbloquear o veículo "${sanitizeText(device.name)}"?`,
                warningText: device.status !== 'online'
                  ? (KT('device.offline_warning') || 'Atenção: Dispositivo offline. O comando será executado quando ficar online.')
                  : '',
                sliderText: 'Deslize para desbloquear',
                actionType: 'success',
                callback: async () => {
                  try {
                    const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineResume');
                    if (changeNative) {
                      await runtimeApi.sendCommand({ ...changeNative, ...{ deviceId: deviceId } });
                    } else {
                      await runtimeApi.sendCommand({ deviceId: deviceId, type: "engineResume" });
                    }
                    registerCommand(deviceId, 'engineResume');
                    ElNotification({
                      title: KT('success'),
                      message: KT('device.command_sent'),
                      type: 'success',
                    });
                  } catch (error) {
                    console.error('[markerContext] Erro ao desbloquear:', error);
                    ElMessage.error('Erro ao enviar comando');
                  }
                }
              });
            }
          }
        });
      } else if (store.getters.advancedPermissions && store.getters.advancedPermissions(10)) {
        if (addSep) {
          tmp.push({ text: 'separator' });
          addSep = false;
        }
        tmp.push({
          disabled: (device.status !== 'online'),
          icon: 'fas fa-lock',
          text: KT('device.lock'),
          cb: () => {
            // Verificar cooldown para lock
            const cooldownRemaining = isInCooldown(deviceId, 'engineStop');
            
            if (cooldownRemaining > 0) {
              const seconds = Math.ceil(cooldownRemaining / 1000);
              
              devMark('cooldown', {
                deviceId,
                commandType: 'engineStop',
                remainingMs: cooldownRemaining,
                remainingSec: seconds
              });
              
              ElMessage.warning(`Aguarde ${seconds}s para reenviar este comando.`);
              return;
            }

            // Usar SliderConfirmModal
            if (ui.sliderConfirm) {
              ui.sliderConfirm({
                title: KT('device.lock') || 'Bloquear Veículo',
                deviceName: sanitizeText(device.name),
                message: KT('device.confirm_lock', device) || `Deseja bloquear o veículo "${sanitizeText(device.name)}"?`,
                warningText: device.status !== 'online'
                  ? (KT('device.offline_warning') || 'Atenção: Dispositivo offline. O comando será executado quando ficar online.')
                  : '',
                sliderText: 'Deslize para bloquear',
                actionType: 'danger',
                callback: async () => {
                  try {
                    const changeNative = availableSaved.find((a) => a.attributes['tarkan.changeNative'] && a.attributes['tarkan.changeNative'] === 'engineStop');
                    if (changeNative) {
                      await runtimeApi.sendCommand({ ...changeNative, ...{ deviceId: deviceId } });
                    } else {
                      await runtimeApi.sendCommand({ deviceId: deviceId, type: "engineStop" });
                    }
                    registerCommand(deviceId, 'engineStop');
                    ElNotification({
                      title: KT('success'),
                      message: KT('device.command_sent'),
                      type: 'success',
                    });
                  } catch (error) {
                    console.error('[markerContext] Erro ao bloquear:', error);
                    ElMessage.error('Erro ao enviar comando');
                  }
                }
              });
            }
          }
        });
      }

      // === SEÇÃO: Enviar Comando ===
      if (store.getters.advancedPermissions && store.getters.advancedPermissions(12)) {
        if (addSep) {
          tmp.push({ text: 'separator' });
          addSep = false;
        }
        tmp.push({
          text: KT('device.send_command'),
          icon: 'fas fa-terminal',
          submenu: commands
        });
      }

      // === SEÇÃO: Atribuições ===
      let attributions = [];
      attributions.push({
        text: KT('geofence.geofences'),
        icon: 'fas fa-map-marker-alt',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'geofences' });
          }
        }
      });

      attributions.push({
        text: KT('attribute.computedAttributes'),
        icon: 'fas fa-calculator',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'attributes' });
          }
        }
      });

      attributions.push({
        text: KT('driver.drivers'),
        icon: 'fas fa-user',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'drivers' });
          }
        }
      });

      attributions.push({
        text: KT('command.savedCommands'),
        icon: 'fas fa-tasks',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'commands' });
          }
        }
      });

      attributions.push({
        text: KT('notification.notifications'),
        icon: 'fas fa-bell',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'notifications' });
          }
        }
      });

      attributions.push({
        text: KT('maintenance.maintenances'),
        icon: 'fas fa-wrench',
        cb: () => {
          if (ui.linkObjects && ui.linkObjects.showObjects) {
            ui.linkObjects.showObjects({ deviceId: deviceId, type: 'maintence' });
          }
        }
      });

      if (store.getters.advancedPermissions && store.getters.advancedPermissions(14)) {
        tmp.push({
          text: KT('device.attributions'),
          icon: 'fas fa-tags',
          submenu: attributions
        });

        tmp.push({
          text: KT('device.edit'),
          icon: 'fas fa-edit',
          cb: () => {
            if (ui.editDevice && ui.editDevice.editDevice) {
              ui.editDevice.editDevice(deviceId);
            }
          }
        });
      }

      // === SEÇÃO: Logs (Admin only) ===
      if (user.administrator) {
        tmp.push({
          text: KT('device.logs'),
          icon: 'fas fa-file-alt',
          cb: () => {
            if (ui.logObjects && ui.logObjects.showLogs) {
              ui.logObjects.showLogs({ deviceId: deviceId });
            }
          }
        });
      }

      // === Abrir menu de contexto ===
      // NOTA: contextMenu é um ref Vue, precisamos acessar .value para obter o componente
      const contextMenuComponent = ui.contextMenu?.value || ui.contextMenu;
      if (contextMenuComponent && contextMenuComponent.openMenu) {
        const eventToPass = evt.originalEvent || evt;
        contextMenuComponent.openMenu({ evt: eventToPass, menus: tmp });
      } else {
        console.warn('[markerContext] contextMenu.openMenu não disponível', { 
          hasContextMenu: !!ui.contextMenu,
          hasValue: !!ui.contextMenu?.value,
          hasOpenMenu: !!(ui.contextMenu?.value?.openMenu || ui.contextMenu?.openMenu)
        });
      }

      return true;
    } catch (error) {
      console.error('[markerContext] Erro:', error);
      return false;
    }
  };
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  const cleanup = () => {
    if (disposed) return;
    
    // Cancelar debounce
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer);
      hoverDebounceTimer = null;
    }
    
    // Limpar caches
    tooltipCache.clear();
    cacheTimestamps.clear();
    commandCooldowns.clear();
    
    disposed = true;
  };
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    markerOver,
    markerOut,
    markerClick,
    markerContext,
    cleanup
  };
}
