/**
 * OverlayRegistry - Sistema centralizado de gerenciamento de overlays do mapa
 * 
 * PR#4 - Map Overlays Cleanup (REVISADO)
 * 
 * CORREÇÕES APLICADAS:
 * - Des-singletonizado: cada componente cria sua própria instância
 * - clear(category): agora remove também dos Sets principais e atualiza stats
 * - _safeRemove: tenta remove()/removeFrom() antes de instanceof (mais robusto)
 * - Suporte a scope para clearByScope()
 * - Stats coerentes com operações
 * 
 * Responsabilidade: Rastrear e remover TODOS os objetos criados no mapa
 * - Markers (L.marker, L.circleMarker, etc)
 * - Polylines / Polygons
 * - Layers / LayerGroups
 * - Controls (L.Control.*)
 * - Event Listeners
 */

// Não importar L aqui para evitar problemas de inicialização
// O check de instanceof será feito de forma mais robusta

export class OverlayRegistry {
  constructor(scope = 'default') {
    // Scope desta instância (history, geofences, etc)
    this.scope = scope;
    
    // Sets separados por tipo para remoção ordenada
    this.listeners = new Set();      // Event listeners (remover primeiro)
    this.markers = new Set();         // L.marker, L.circleMarker
    this.polylines = new Set();       // L.polyline, L.polygon
    this.layers = new Set();          // L.layerGroup, L.featureGroup
    this.controls = new Set();        // L.Control.* (search, zoom, etc)
    this.custom = new Set();          // Objetos customizados com .remove()
    
    // Categorização opcional (route, events, geofences, etc)
    this.categories = new Map();
    
    // Stats para debug
    this.stats = {
      registered: 0,
      removed: 0,
      leaked: 0
    };
    
    // Referência ao mapa (opcional, para cleanup mais robusto)
    this._map = null;
  }

  /**
   * Define referência ao mapa Leaflet
   * @param {L.Map} map
   */
  setMap(map) {
    this._map = map;
  }

  /**
   * Registra um marker
   * @param {L.Marker|L.CircleMarker} marker
   * @param {string} category - Opcional: 'route', 'events', 'geofences'
   */
  addMarker(marker, category = null) {
    if (!marker) return;
    this.markers.add(marker);
    this._addToCategory(marker, category);
    this.stats.registered++;
  }

  /**
   * Registra um polyline/polygon
   * @param {L.Polyline|L.Polygon} polyline
   * @param {string} category
   */
  addPolyline(polyline, category = null) {
    if (!polyline) return;
    this.polylines.add(polyline);
    this._addToCategory(polyline, category);
    this.stats.registered++;
  }

  /**
   * Registra um layer/layerGroup
   * @param {L.Layer|L.LayerGroup} layer
   * @param {string} category
   */
  addLayer(layer, category = null) {
    if (!layer) return;
    this.layers.add(layer);
    this._addToCategory(layer, category);
    this.stats.registered++;
  }

  /**
   * Registra um control (L.Control.Search, etc)
   * @param {L.Control} control
   * @param {string} category
   */
  addControl(control, category = null) {
    if (!control) return;
    this.controls.add(control);
    this._addToCategory(control, category);
    this.stats.registered++;
  }

  /**
   * Registra um listener (função de remoção)
   * @param {Function} offFn - Função que remove o listener (ex: map.off('click', handler))
   * @param {string} category
   */
  addListener(offFn, category = null) {
    if (!offFn || typeof offFn !== 'function') return;
    this.listeners.add(offFn);
    this._addToCategory(offFn, category);
    this.stats.registered++;
  }

  /**
   * Registra objeto customizado (deve ter método .remove())
   * @param {Object} obj
   * @param {string} category
   */
  addCustom(obj, category = null) {
    if (!obj) return;
    // Aceita objetos sem .remove() - usaremos fallback
    this.custom.add(obj);
    this._addToCategory(obj, category);
    this.stats.registered++;
  }

  /**
   * Remove um item específico de todos os sets
   * @param {any} item
   * @returns {boolean} true se encontrou e removeu
   */
  removeItem(item) {
    if (!item) return false;
    
    let found = false;
    
    // Remover de todos os sets
    if (this.markers.delete(item)) found = true;
    if (this.polylines.delete(item)) found = true;
    if (this.layers.delete(item)) found = true;
    if (this.controls.delete(item)) found = true;
    if (this.custom.delete(item)) found = true;
    if (this.listeners.delete(item)) found = true;
    
    // Remover de categorias
    this.categories.forEach((items, category) => {
      if (items.delete(item)) found = true;
      if (items.size === 0) {
        this.categories.delete(category);
      }
    });
    
    // Tentar remover do mapa
    if (found) {
      this._safeRemove(item);
      this.stats.removed++;
    }
    
    return found;
  }

  /**
   * Remove todos os overlays de uma categoria específica
   * CORRIGIDO: Agora remove também dos Sets principais e atualiza stats
   * @param {string} category
   */
  clear(category) {
    if (!this.categories.has(category)) return;
    
    const items = this.categories.get(category);
    let removed = 0;
    
    items.forEach(item => {
      // 1. Remover do mapa
      if (this._safeRemove(item)) {
        removed++;
      }
      
      // 2. Remover dos Sets principais
      this.markers.delete(item);
      this.polylines.delete(item);
      this.layers.delete(item);
      this.controls.delete(item);
      this.custom.delete(item);
      this.listeners.delete(item);
    });
    
    // 3. Limpar da categoria
    this.categories.delete(category);
    
    // 4. Atualizar stats
    this.stats.removed += removed;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OverlayRegistry:${this.scope}] clear('${category}'): ${removed} items removidos`);
    }
  }

  /**
   * Remove TODOS os overlays (ordem crítica)
   * 1. Listeners (para parar eventos)
   * 2. Controls
   * 3. Markers
   * 4. Polylines
   * 5. Layers
   * 6. Custom objects
   */
  clearAll() {
    let removed = 0;

    // 1. Remover listeners primeiro (evita eventos disparando durante cleanup)
    this.listeners.forEach(offFn => {
      try {
        if (typeof offFn === 'function') {
          offFn();
          removed++;
        }
      } catch (err) {
        this.stats.leaked++;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[OverlayRegistry:${this.scope}] Erro removendo listener:`, err);
        }
      }
    });
    this.listeners.clear();

    // 2. Remover controls (antes de layers para evitar referências órfãs)
    this.controls.forEach(control => {
      if (this._safeRemoveControl(control)) removed++;
    });
    this.controls.clear();

    // 3. Remover markers
    this.markers.forEach(marker => {
      if (this._safeRemove(marker)) removed++;
    });
    this.markers.clear();

    // 4. Remover polylines
    this.polylines.forEach(polyline => {
      if (this._safeRemove(polyline)) removed++;
    });
    this.polylines.clear();

    // 5. Remover layers
    this.layers.forEach(layer => {
      if (this._safeRemove(layer)) removed++;
    });
    this.layers.clear();

    // 6. Remover custom objects
    this.custom.forEach(obj => {
      if (this._safeRemove(obj)) removed++;
    });
    this.custom.clear();

    // Limpar categorias
    this.categories.clear();

    this.stats.removed += removed;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[OverlayRegistry:${this.scope}] clearAll: ${removed} items removidos`);
    }
    
    return removed;
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = { registered: 0, removed: 0, leaked: 0 };
  }

  /**
   * Retorna estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      scope: this.scope,
      active: this.markers.size + this.polylines.size + this.layers.size + 
              this.controls.size + this.custom.size,
      listeners: this.listeners.size,
      categories: Array.from(this.categories.keys())
    };
  }

  /**
   * Verifica se está vazio
   */
  isEmpty() {
    return this.markers.size === 0 && 
           this.polylines.size === 0 && 
           this.layers.size === 0 &&
           this.controls.size === 0 &&
           this.custom.size === 0 &&
           this.listeners.size === 0;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Adiciona item a uma categoria
   */
  _addToCategory(item, category) {
    if (!category) return;
    
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category).add(item);
  }

  /**
   * Remove control com segurança (L.Control.*)
   * @returns {boolean} true se removeu com sucesso
   */
  _safeRemoveControl(control) {
    if (!control) return false;
    
    try {
      // Controls têm removeFrom(map) ou remove()
      if (control.remove && typeof control.remove === 'function') {
        control.remove();
        return true;
      }
      
      if (control._map && control.removeFrom && typeof control.removeFrom === 'function') {
        control.removeFrom(control._map);
        return true;
      }
      
      // Fallback: remover via mapa
      if (this._map && this._map.removeControl) {
        this._map.removeControl(control);
        return true;
      }
      
      return false;
    } catch (err) {
      this.stats.leaked++;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[OverlayRegistry:${this.scope}] Erro removendo control:`, err);
      }
      return false;
    }
  }

  /**
   * Remove item com segurança (try/catch silencioso)
   * CORRIGIDO: Tenta remove()/removeFrom() ANTES de instanceof
   * @returns {boolean} true se removeu com sucesso
   */
  _safeRemove(item) {
    if (!item) return false;

    try {
      // 1. PRIMEIRO: Tentar métodos de remoção diretamente (mais robusto)
      
      // 1a. Objeto com removeFrom(map) - padrão Leaflet
      if (item.removeFrom && typeof item.removeFrom === 'function') {
        if (item._map) {
          item.removeFrom(item._map);
          return true;
        }
        if (this._map) {
          item.removeFrom(this._map);
          return true;
        }
      }
      
      // 1b. Objeto com remove() - padrão genérico
      if (item.remove && typeof item.remove === 'function') {
        item.remove();
        return true;
      }
      
      // 2. LayerGroup com clearLayers()
      if (item.clearLayers && typeof item.clearLayers === 'function') {
        item.clearLayers();
        // Também tenta remover o próprio layer
        if (item._map && item._map.removeLayer) {
          item._map.removeLayer(item);
        }
        return true;
      }
      
      // 3. Fallback: remover do mapa se tiver _map
      if (item._map && typeof item._map.removeLayer === 'function') {
        item._map.removeLayer(item);
        return true;
      }
      
      // 4. Fallback final: usar mapa da instância
      if (this._map && this._map.hasLayer && this._map.hasLayer(item)) {
        this._map.removeLayer(item);
        return true;
      }

      return false;
    } catch (err) {
      this.stats.leaked++;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[OverlayRegistry:${this.scope}] Erro removendo item:`, err, item);
      }
      return false;
    }
  }
}

/**
 * Factory para criar instância (NÃO singleton - cada componente cria a sua)
 * @param {string} scope - Identificador do escopo (history, geofences, etc)
 * @returns {OverlayRegistry}
 */
export function createOverlayRegistry(scope = 'default') {
  return new OverlayRegistry(scope);
}

export default OverlayRegistry;
