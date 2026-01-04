/**
 * FASE D1: MapLayerManager - Gerenciador centralizado de layers Leaflet
 * HARDENING: Integrado com mapGuards para prevenir bugs silenciosos
 * 
 * Responsabilidades:
 * - Criar/atualizar/remover polylines de rota (completa e progressiva)
 * - Criar/atualizar/remover marker do veículo (play)
 * - Criar/atualizar/remover preview marker (timeline seek)
 * - Criar/atualizar/remover markers de início/fim
 * - Criar/atualizar/remover heatmap
 * - Cleanup completo de todos os layers (previne memory leaks)
 * 
 * @class MapLayerManager
 * @created 2026-01-02
 */

import L from 'leaflet';
import 'leaflet.heat';
import { 
  isValidLatLng, 
  safeLatLng, 
  normalizeCourse as guardNormalizeCourse,
  extractLatLng,
  filterValidPoints,
  safeArray,
  safeSpeed,
  assertMapReady,
  safeNumber
} from './mapGuards';

// ============================================================================
// CONSTANTES
// ============================================================================

const COURSE_CHANGE_THRESHOLD = 3; // graus - threshold para atualizar ícone do veículo
const DEFAULT_ROUTE_COLOR = '#05a7e3';
const DEFAULT_PLAY_ROUTE_COLOR = '#ff6b35';
const DEFAULT_ROUTE_WEIGHT = 4;
const DEFAULT_ROUTE_OPACITY = 0.6;

// ============================================================================
// CLASS: MapLayerManager
// ============================================================================

export class MapLayerManager {
  constructor(leafletMap, config = {}) {
    // Validar que mapa está pronto
    try {
      assertMapReady(leafletMap, 'MapLayerManager constructor');
    } catch (error) {
      if (config.onError) {
        config.onError(error);
      }
      throw error;
    }

    this._map = leafletMap;
    this._config = {
      routeColor: config.routeColor || DEFAULT_ROUTE_COLOR,
      routeWeight: safeNumber(config.routeWeight, DEFAULT_ROUTE_WEIGHT, 'routeWeight'),
      routeOpacity: safeNumber(config.routeOpacity, DEFAULT_ROUTE_OPACITY, 'routeOpacity'),
      onError: config.onError || ((err) => console.error('[MapLayerManager]', err)),
      devLog: config.devLog || (() => {}),
    };

    // Layers (privados)
    this._fullRoutePolyline = null;
    this._playRoutePolyline = null;
    this._vehicleMarker = null;
    this._previewMarker = null;
    this._startMarker = null;
    this._endMarker = null;
    this._heatLayer = null;

    // Cache de estado
    this._lastVehicleCourse = null;
    this._previewTimeout = null;
  }

  // ==========================================================================
  // FULL ROUTE (Rota completa - sempre visível)
  // ==========================================================================

  /**
   * Define rota completa (polyline azul)
   * @param {Array} points - Array de pontos [[lat, lng], ...] ou [{latitude, longitude}, ...]
   * @param {Object} opts - Opções (color, weight, opacity)
   */
  setFullRoute(points, opts = {}) {
    try {
      assertMapReady(this._map, 'setFullRoute');

      // HARDENING: Validar e filtrar pontos
      const safePoints = safeArray(points, 'setFullRoute');
      const normalized = this._normalizePoints(safePoints);

      if (normalized.length === 0) {
        this._config.devLog('[MapLayerManager] setFullRoute: nenhum ponto válido, não criando polyline');
        this.clearFullRoute();
        return;
      }

      // Remover polyline antiga antes de criar nova
      this.clearFullRoute();

      this._fullRoutePolyline = L.polyline(normalized, {
        color: opts.color || this._config.routeColor,
        weight: safeNumber(opts.weight, this._config.routeWeight, 'setFullRoute.weight'),
        opacity: safeNumber(opts.opacity, this._config.routeOpacity, 'setFullRoute.opacity'),
        smoothFactor: 1,
      }).addTo(this._map);

      this._config.devLog(`[MapLayerManager] Full route criada com ${normalized.length} pontos`);
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearFullRoute() {
    if (this._fullRoutePolyline) {
      this._map.removeLayer(this._fullRoutePolyline);
      this._fullRoutePolyline = null;
      this._config.devLog('[MapLayerManager] Full route removida');
    }
  }

  hasFullRoute() {
    return this._fullRoutePolyline != null;
  }

  // ==========================================================================
  // PLAY ROUTE (Rota progressiva - durante playback)
  // ==========================================================================

  /**
   * Define rota progressiva (polyline laranja vibrante)
   * @param {Array} points - Array de pontos [[lat, lng], ...]
   * @param {Object} opts - Opções (color, weight, opacity)
   */
  setPlayRoute(points, opts = {}) {
    try {
      assertMapReady(this._map, 'setPlayRoute');

      // HARDENING: Validar e filtrar pontos
      const safePoints = safeArray(points, 'setPlayRoute');
      const normalized = this._normalizePoints(safePoints);

      if (normalized.length === 0) {
        this.clearPlayRoute();
        return;
      }

      // Remover polyline antiga antes de criar nova
      this.clearPlayRoute();

      this._playRoutePolyline = L.polyline(normalized, {
        color: opts.color || DEFAULT_PLAY_ROUTE_COLOR,
        weight: safeNumber(opts.weight, 5, 'setPlayRoute.weight'),
        opacity: safeNumber(opts.opacity, 0.8, 'setPlayRoute.opacity'),
        smoothFactor: 1,
      }).addTo(this._map);

      this._config.devLog(`[MapLayerManager] Play route criada com ${normalized.length} pontos`);
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearPlayRoute() {
    if (this._playRoutePolyline) {
      this._map.removeLayer(this._playRoutePolyline);
      this._playRoutePolyline = null;
      this._config.devLog('[MapLayerManager] Play route removida');
    }
  }

  hasPlayRoute() {
    return this._playRoutePolyline != null;
  }

  // ==========================================================================
  // VEHICLE MARKER (Marcador do veículo durante play)
  // ==========================================================================

  /**
   * Atualiza ou cria marker do veículo (reutiliza mesma instância para performance)
   * Só atualiza ícone se course mudou >= 3° (threshold)
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @param {Number} course - Ângulo de rotação (0-360)
   * @param {String} iconUrl - URL do ícone do veículo
   */
  setVehicleMarker(lat, lng, course = 0, iconUrl = '') {
    try {
      assertMapReady(this._map, 'setVehicleMarker');

      // HARDENING: Validar coordenadas
      if (!isValidLatLng(lat, lng)) {
        this._config.devLog(`[MapLayerManager] setVehicleMarker: lat/lng inválidos (${lat}, ${lng}), ignorando`);
        return;
      }

      const [safeLat, safeLng] = safeLatLng(lat, lng, 'setVehicleMarker');
      const safeCourse = guardNormalizeCourse(course, 'setVehicleMarker');

      if (!this._vehicleMarker) {
        // Criar marker pela primeira vez
        this._vehicleMarker = L.marker([safeLat, safeLng], {
          icon: this._createVehicleIcon(safeCourse, iconUrl),
          zIndexOffset: 1000,
        }).addTo(this._map);

        this._lastVehicleCourse = safeCourse;
        this._config.devLog(`[MapLayerManager] Vehicle marker criado em (${safeLat}, ${safeLng}), course=${safeCourse}°`);
      } else {
        // Atualizar posição (sempre - é barato)
        this._vehicleMarker.setLatLng([safeLat, safeLng]);

        // Só atualizar ícone se course mudou significativamente (threshold)
        const lastCourse = this._lastVehicleCourse ?? 0;
        const courseDiff = Math.abs(safeCourse - lastCourse);
        // Considerar wraparound (359° → 1° = diferença de 2°, não 358°)
        const wrappedDiff = Math.min(courseDiff, 360 - courseDiff);

        if (wrappedDiff >= COURSE_CHANGE_THRESHOLD) {
          this._vehicleMarker.setIcon(this._createVehicleIcon(safeCourse, iconUrl));
          this._lastVehicleCourse = safeCourse;
          this._config.devLog(`[MapLayerManager] Vehicle marker ícone atualizado, course=${safeCourse}°`);
        }
      }
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearVehicleMarker() {
    if (this._vehicleMarker) {
      this._map.removeLayer(this._vehicleMarker);
      this._vehicleMarker = null;
      this._lastVehicleCourse = null;
      this._config.devLog('[MapLayerManager] Vehicle marker removido');
    }
  }

  hasVehicleMarker() {
    return this._vehicleMarker != null;
  }

  /**
   * PRIVADO: Cria ícone rotacionado do veículo
   * @param {Number} course - Ângulo de rotação (0-360)
   * @param {String} iconUrl - URL do ícone
   * @returns {L.DivIcon}
   */
  _createVehicleIcon(course, iconUrl) {
    const safeCourse = guardNormalizeCourse(course, '_createVehicleIcon');

    return L.divIcon({
      className: 'play-vehicle-icon-container',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      html: `
        <div class="play-device-marker" style="transform: rotate(${safeCourse}deg);">
          <img src="${iconUrl}" alt="device" style="width: 40px; height: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" />
        </div>
      `,
    });
  }

  // ==========================================================================
  // PREVIEW MARKER (Halo temporário ao clicar na timeline)
  // ==========================================================================

  /**
   * Mostra preview marker (auto-remove após 2s)
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @param {Object} opts - Opções (color, radius, fillOpacity)
   */
  showPreviewMarker(lat, lng, opts = {}) {
    try {
      assertMapReady(this._map, 'showPreviewMarker');

      // HARDENING: Validar coordenadas
      if (!isValidLatLng(lat, lng)) {
        this._config.devLog(`[MapLayerManager] showPreviewMarker: lat/lng inválidos (${lat}, ${lng}), ignorando`);
        return;
      }

      const [safeLat, safeLng] = safeLatLng(lat, lng, 'showPreviewMarker');

      // Sempre limpar preview anterior (inclui timeout)
      this.clearPreviewMarker();

      this._previewMarker = L.circleMarker([safeLat, safeLng], {
        color: opts.color || '#05a7e3',
        radius: safeNumber(opts.radius, 15, 'showPreviewMarker.radius'),
        fillOpacity: safeNumber(opts.fillOpacity, 0.15, 'showPreviewMarker.fillOpacity'),
        weight: 2,
      }).addTo(this._map);

      // Auto-remover após 2 segundos
      this._previewTimeout = setTimeout(() => {
        this.clearPreviewMarker();
      }, 2000);

      this._config.devLog(`[MapLayerManager] Preview marker criado em (${safeLat}, ${safeLng})`);
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearPreviewMarker() {
    if (this._previewMarker) {
      this._map.removeLayer(this._previewMarker);
      this._previewMarker = null;
    }

    if (this._previewTimeout) {
      clearTimeout(this._previewTimeout);
      this._previewTimeout = null;
    }
  }

  // ==========================================================================
  // START/END MARKERS (Marcadores de início e fim da rota)
  // ==========================================================================

  /**
   * Define markers de início (verde) e fim (vermelho)
   * @param {Array|Object} start - [lat, lng] ou {latitude, longitude}
   * @param {Array|Object} end - [lat, lng] ou {latitude, longitude}
   * @param {Object} opts - Opções (startColor, endColor, radius)
   */
  setStartEndMarkers(start, end, opts = {}) {
    try {
      assertMapReady(this._map, 'setStartEndMarkers');

      // Limpar markers antigos
      this.clearStartEndMarkers();

      // HARDENING: Extrair coordenadas com validação
      const startLatLng = extractLatLng(start, 'setStartEndMarkers.start');
      const endLatLng = extractLatLng(end, 'setStartEndMarkers.end');

      if (!startLatLng) {
        this._config.devLog('[MapLayerManager] setStartEndMarkers: ponto de início inválido, ignorando');
        return;
      }

      if (!endLatLng) {
        this._config.devLog('[MapLayerManager] setStartEndMarkers: ponto de fim inválido, ignorando');
        return;
      }

      // Marker de início (verde)
      this._startMarker = L.circleMarker(startLatLng, {
        color: opts.startColor || '#28a745',
        radius: safeNumber(opts.radius, 8, 'setStartEndMarkers.radius'),
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(this._map);

      // Marker de fim (vermelho)
      this._endMarker = L.circleMarker(endLatLng, {
        color: opts.endColor || '#dc3545',
        radius: safeNumber(opts.radius, 8, 'setStartEndMarkers.radius'),
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(this._map);

      this._config.devLog('[MapLayerManager] Start/End markers criados');
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearStartEndMarkers() {
    if (this._startMarker) {
      this._map.removeLayer(this._startMarker);
      this._startMarker = null;
    }

    if (this._endMarker) {
      this._map.removeLayer(this._endMarker);
      this._endMarker = null;
    }
  }

  // ==========================================================================
  // HEATMAP (Mapa de calor baseado em velocidade)
  // ==========================================================================

  /**
   * Ativa/desativa heatmap
   * @param {Boolean} enabled - Se true, cria heatmap; se false, remove
   * @param {Array} points - Array de pontos com velocidade [[lat, lng, speed], ...]
   * @param {Object} opts - Opções (radius, blur, maxZoom, gradient, centerOnLast)
   */
  toggleHeatmap(enabled, points = [], opts = {}) {
    try {
      assertMapReady(this._map, 'toggleHeatmap');

      // Sempre limpar heatmap antiga primeiro
      this.clearHeatmap();

      if (!enabled) {
        return;
      }

      // HARDENING: Validar e filtrar pontos
      const safePoints = safeArray(points, 'toggleHeatmap');
      const normalized = this._normalizePoints(safePoints);

      if (normalized.length === 0) {
        this._config.devLog('[MapLayerManager] toggleHeatmap: nenhum ponto válido, não criando heatmap');
        return;
      }

      // Preparar dados: [lat, lng, intensity baseada em velocidade]
      const heatData = normalized.map((p) => {
        const lat = p[0];
        const lng = p[1];
        const speedRaw = p[3] || p.speed || 0;
        const speed = safeSpeed(speedRaw, 'toggleHeatmap.speed');

        // Intensity: velocidade / 100, clamped a [0, 1]
        // Se velocidade = 0, usar 0.6 para paradas ainda serem visíveis
        const intensity = speed > 0 ? Math.min(speed / 100, 1) : 0.6;

        return [lat, lng, intensity];
      });

      // Criar heatmap
      this._heatLayer = L.heatLayer(heatData, {
        radius: safeNumber(opts.radius, 20, 'toggleHeatmap.radius'),
        blur: safeNumber(opts.blur, 20, 'toggleHeatmap.blur'),
        maxZoom: safeNumber(opts.maxZoom, 10, 'toggleHeatmap.maxZoom'),
        gradient: opts.gradient || {
          0.0: 'blue',
          0.3: 'cyan',
          0.5: 'lime',
          0.7: 'yellow',
          1.0: 'red',
        },
      }).addTo(this._map);

      // Centralizar no último ponto (opcional)
      if (opts.centerOnLast !== false) {
        const lastPoint = heatData[heatData.length - 1];
        if (lastPoint) {
          this._map.setView([lastPoint[0], lastPoint[1]], 15);
        }
      }

      this._config.devLog(`[MapLayerManager] Heatmap criado com ${heatData.length} pontos`);
    } catch (error) {
      this._config.onError(error);
    }
  }

  clearHeatmap() {
    if (this._heatLayer) {
      this._map.removeLayer(this._heatLayer);
      this._heatLayer = null;
      this._config.devLog('[MapLayerManager] Heatmap removido');
    }
  }

  hasHeatmap() {
    return this._heatLayer != null;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Remove todos os layers e limpa referências (previne memory leaks)
   */
  destroy() {
    this.clearFullRoute();
    this.clearPlayRoute();
    this.clearVehicleMarker();
    this.clearPreviewMarker();
    this.clearStartEndMarkers();
    this.clearHeatmap();

    // Nullificar referências
    this._map = null;
    this._config = null;

    this._config?.devLog('[MapLayerManager] Destruído');
  }

  // ==========================================================================
  // HELPERS PRIVADOS
  // ==========================================================================

  /**
   * PRIVADO: Normaliza array de pontos para formato [[lat, lng], ...]
   * HARDENING: Filtra pontos inválidos
   * @param {Array} points - Array de pontos
   * @returns {Array} Array normalizado
   */
  _normalizePoints(points) {
    if (!Array.isArray(points)) {
      return [];
    }

    // HARDENING: Filtrar pontos inválidos
    const valid = filterValidPoints(points, 'MapLayerManager._normalizePoints');

    // Normalizar formato
    return valid.map((p) => {
      // Formato array: [lat, lng, ...]
      if (Array.isArray(p)) {
        const [lat, lng] = safeLatLng(p[0], p[1], 'MapLayerManager._normalizePoints');
        return [lat, lng];
      }

      // Formato objeto: { latitude, longitude } ou { lat, lng }
      const lat = p.latitude ?? p.lat;
      const lng = p.longitude ?? p.lng;
      const [safeLat, safeLng] = safeLatLng(lat, lng, 'MapLayerManager._normalizePoints');
      return [safeLat, safeLng];
    });
  }
}

export default MapLayerManager;
