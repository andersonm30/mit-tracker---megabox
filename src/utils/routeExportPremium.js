/**
 * routeExportPremium.js
 * 
 * FASE 9 — Exportação Premium de Rotas
 * 
 * Funções para gerar PDF premium e Excel multi-aba.
 * Usa dados já computados (summary, chapters, events, bookmarks).
 * 
 * ⚠️ REGRAS:
 * - Funções puras (recebem dados, retornam HTML/Blob)
 * - Sem dependência de Vue/Store
 * - Performance: dados já processados, apenas formatação
 */

// ============================================================================
// HELPERS DE FORMATAÇÃO
// ============================================================================

/**
 * Formata data para exibição
 * @param {string|Date} date 
 * @param {string} locale 
 * @returns {string}
 */
const formatDateTime = (date, locale = 'pt-BR') => {
  if (!date) return '-';
  return new Date(date).toLocaleString(locale);
};

/**
 * Formata data curta (só hora)
 * @param {string|Date} date 
 * @returns {string}
 */
const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('pt-BR');
};

/**
 * Escapa HTML para evitar XSS
 * @param {string} str 
 * @returns {string}
 */
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Trunca texto longo
 * @param {string} str 
 * @param {number} max 
 * @returns {string}
 */
const truncate = (str, max = 50) => {
  if (!str || str.length <= max) return str || '';
  return str.substring(0, max) + '...';
};

// Mapa de ícones para tipos de evento (para PDF)
const EVENT_ICONS = {
  start: '▶',
  end: '⏹',
  stop: '🅿',
  speed: '⚡',
  ignition_on: '🔑',
  ignition_off: '⏻'
};

// ============================================================================
// PDF PREMIUM
// ============================================================================

/**
 * Gera HTML para PDF premium
 * 
 * @param {Object} params
 * @param {string} params.deviceName - Nome do dispositivo
 * @param {number} params.deviceId - ID do dispositivo
 * @param {Date[]} params.dateRange - [startDate, endDate]
 * @param {Object} params.summary - routeSummary
 * @param {Array} params.chapters - routeChapters
 * @param {Array} params.events - routeEvents
 * @param {Array} params.bookmarks - bookmarks
 * @param {Object} params.stats - { totalDistance, avgSpeed, duration, stopTime }
 * @param {Object} params.i18n - Objeto com traduções
 * @param {string} [params.systemName] - Nome do sistema (opcional)
 * @returns {string} - HTML completo
 */
export const generatePremiumPdfHtml = (params) => {
  const {
    deviceName = 'Dispositivo',
    deviceId = '',
    dateRange = [],
    summary = {},
    chapters = [],
    events = [],
    bookmarks = [],
    stats = {},
    i18n = {},
    systemName = 'Sistema de Rastreamento'
  } = params;
  
  const t = (key, fallback) => i18n[key] || fallback;
  
  const startDateStr = dateRange[0] ? formatDateTime(dateRange[0]) : '-';
  const endDateStr = dateRange[1] ? formatDateTime(dateRange[1]) : '-';
  const generatedAt = formatDateTime(new Date());
  
  // Gerar tabela de capítulos
  const chaptersHtml = chapters.length > 0 ? `
    <div class="section">
      <h2>${t('report.chapters', 'Trechos da Viagem')}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${t('report.startTime', 'Início')}</th>
            <th>${t('report.endTime', 'Fim')}</th>
            <th>${t('report.duration', 'Duração')}</th>
            <th>${t('report.distance', 'Distância')}</th>
            <th>${t('report.startAddress', 'Origem')}</th>
            <th>${t('report.endAddress', 'Destino')}</th>
          </tr>
        </thead>
        <tbody>
          ${chapters.map(ch => `
            <tr>
              <td>${ch.id}</td>
              <td>${escapeHtml(ch.startTime)}</td>
              <td>${escapeHtml(ch.endTime)}</td>
              <td>${escapeHtml(ch.durationLabel)}</td>
              <td>${ch.distanceKm} km</td>
              <td>${escapeHtml(truncate(ch.startAddress, 40))}</td>
              <td>${escapeHtml(truncate(ch.endAddress, 40))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';
  
  // Gerar tabela de eventos (excluir start/end)
  const significantEvents = events.filter(e => !['start', 'end'].includes(e.type));
  const eventsHtml = significantEvents.length > 0 ? `
    <div class="section">
      <h2>${t('report.events', 'Eventos Detectados')}</h2>
      <table>
        <thead>
          <tr>
            <th>${t('report.type', 'Tipo')}</th>
            <th>${t('report.index', 'Ponto')}</th>
            <th>${t('report.time', 'Hora')}</th>
            <th>${t('report.description', 'Descrição')}</th>
            <th>${t('report.address', 'Local')}</th>
          </tr>
        </thead>
        <tbody>
          ${significantEvents.map(ev => `
            <tr>
              <td>${EVENT_ICONS[ev.type] || '•'} ${ev.type === 'stop' ? t('report.stop', 'Parada') : t('report.speeding', 'Velocidade')}</td>
              <td>#${ev.index + 1}</td>
              <td>${ev.meta?.time ? formatTime(ev.meta.time) : '-'}</td>
              <td>${escapeHtml(ev.label)}</td>
              <td>${escapeHtml(truncate(ev.meta?.address, 40))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';
  
  // Gerar tabela de bookmarks
  const bookmarksHtml = bookmarks.length > 0 ? `
    <div class="section">
      <h2>${t('report.bookmarks', 'Pontos Favoritos')}</h2>
      <table>
        <thead>
          <tr>
            <th>${t('report.label', 'Nome')}</th>
            <th>${t('report.index', 'Ponto')}</th>
            <th>${t('report.time', 'Hora')}</th>
            <th>${t('report.address', 'Endereço')}</th>
          </tr>
        </thead>
        <tbody>
          ${bookmarks.map(bk => `
            <tr>
              <td>⭐ ${escapeHtml(bk.label)}</td>
              <td>#${bk.index + 1}</td>
              <td>${bk.fixTime ? formatTime(bk.fixTime) : '-'}</td>
              <td>${escapeHtml(truncate(bk.address, 50))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';
  
  // HTML completo
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${t('report.premiumReport', 'Relatório Premium')} - ${escapeHtml(deviceName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 11px; 
      padding: 25px; 
      color: #333;
      line-height: 1.4;
    }
    
    /* Header */
    .header { 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #2196F3; 
      padding-bottom: 15px; 
      margin-bottom: 20px;
    }
    .header-left h1 { 
      font-size: 20px; 
      color: #2196F3;
      margin-bottom: 5px; 
    }
    .header-left .subtitle { 
      font-size: 12px; 
      color: #666; 
    }
    .header-right {
      text-align: right;
      font-size: 10px;
      color: #999;
    }
    .header-right .system-name {
      font-weight: bold;
      color: #666;
    }
    
    /* Info Box */
    .info-box { 
      display: flex; 
      gap: 20px;
      margin-bottom: 20px; 
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #2196F3;
    }
    .info-item { flex: 1; }
    .info-item strong { 
      display: block; 
      color: #2196F3;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .info-item span { font-size: 12px; }
    
    /* Stats Grid */
    .stats-grid { 
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px; 
      margin-bottom: 25px; 
    }
    .stat-card { 
      text-align: center;
      padding: 15px 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }
    .stat-card.success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .stat-card.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat-card.info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .stat-card .value { 
      font-size: 22px; 
      font-weight: bold; 
    }
    .stat-card .label { 
      font-size: 9px; 
      text-transform: uppercase;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    /* Summary Highlights */
    .highlights {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 25px;
    }
    .highlight-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }
    .highlight-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 16px;
    }
    .highlight-icon.danger { background: #ffebee; color: #d32f2f; }
    .highlight-icon.warning { background: #fff3e0; color: #f57c00; }
    .highlight-content .label { font-size: 9px; color: #999; text-transform: uppercase; }
    .highlight-content .value { font-size: 13px; font-weight: 600; }
    .highlight-content .address { font-size: 9px; color: #666; }
    
    /* Sections */
    .section { 
      margin-bottom: 25px; 
      page-break-inside: avoid;
    }
    .section h2 { 
      font-size: 14px; 
      color: #333;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    /* Tables */
    table { 
      width: 100%; 
      border-collapse: collapse; 
    }
    th, td { 
      border: 1px solid #e0e0e0; 
      padding: 8px 10px; 
      text-align: left; 
    }
    th { 
      background: #2196F3; 
      color: white; 
      font-size: 10px; 
      font-weight: 600;
      text-transform: uppercase;
    }
    td { font-size: 10px; }
    tr:nth-child(even) { background: #fafafa; }
    
    /* Footer */
    .footer { 
      margin-top: 30px; 
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      font-size: 9px; 
      color: #999; 
    }
    
    /* Print Styles */
    @media print {
      body { padding: 15px; }
      .header { page-break-after: avoid; }
      .section { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${t('report.premiumReport', 'Relatório de Percurso Premium')}</h1>
      <div class="subtitle">${escapeHtml(deviceName)} (ID: ${deviceId})</div>
    </div>
    <div class="header-right">
      <div class="system-name">${escapeHtml(systemName)}</div>
      <div>${t('report.generatedAt', 'Gerado em')}: ${generatedAt}</div>
    </div>
  </div>
  
  <!-- Info Box -->
  <div class="info-box">
    <div class="info-item">
      <strong>${t('report.period', 'Período')}</strong>
      <span>${startDateStr} ${t('report.to', 'a')} ${endDateStr}</span>
    </div>
    <div class="info-item">
      <strong>${t('report.totalPoints', 'Total de Pontos')}</strong>
      <span>${summary.totalPoints || 0}</span>
    </div>
    <div class="info-item">
      <strong>${t('report.chapters', 'Trechos')}</strong>
      <span>${chapters.length}</span>
    </div>
    <div class="info-item">
      <strong>${t('report.events', 'Eventos')}</strong>
      <span>${significantEvents.length}</span>
    </div>
  </div>
  
  <!-- Stats Grid -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.totalDistance || summary.totalDistanceKm || 0} km</div>
      <div class="label">${t('report.totalDistance', 'Distância Total')}</div>
    </div>
    <div class="stat-card success">
      <div class="value">${stats.avgSpeed || 0} km/h</div>
      <div class="label">${t('report.avgSpeed', 'Velocidade Média')}</div>
    </div>
    <div class="stat-card info">
      <div class="value">${stats.duration || summary.durationLabel || '0h'}</div>
      <div class="label">${t('report.tripDuration', 'Duração Total')}</div>
    </div>
    <div class="stat-card warning">
      <div class="value">${stats.stopTime || summary.totalStopTimeLabel || '0h'}</div>
      <div class="label">${t('report.stopTime', 'Tempo Parado')}</div>
    </div>
  </div>
  
  <!-- Highlights -->
  ${summary.longestStop || summary.maxSpeed ? `
  <div class="highlights">
    ${summary.longestStop ? `
    <div class="highlight-item">
      <div class="highlight-icon warning">🅿</div>
      <div class="highlight-content">
        <div class="label">${t('report.longestStop', 'Maior Parada')}</div>
        <div class="value">${escapeHtml(summary.longestStop.durationLabel)}</div>
        <div class="address">${escapeHtml(truncate(summary.longestStop.address, 40))}</div>
      </div>
    </div>
    ` : ''}
    ${summary.maxSpeed ? `
    <div class="highlight-item">
      <div class="highlight-icon danger">⚡</div>
      <div class="highlight-content">
        <div class="label">${t('report.maxSpeed', 'Velocidade Máxima')}</div>
        <div class="value">${summary.maxSpeed.value} km/h</div>
        <div class="address">${escapeHtml(truncate(summary.maxSpeed.address, 40))}</div>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}
  
  <!-- Chapters -->
  ${chaptersHtml}
  
  <!-- Events -->
  ${eventsHtml}
  
  <!-- Bookmarks -->
  ${bookmarksHtml}
  
  <!-- Footer -->
  <div class="footer">
    <div>${escapeHtml(systemName)}</div>
    <div>${t('report.footer', 'Relatório gerado automaticamente')}</div>
  </div>
</body>
</html>`;
};

// ============================================================================
// EXCEL (CSV MULTI-SHEET via Download)
// ============================================================================

/**
 * Gera dados para Excel multi-aba (formato CSV com separador)
 * Como não temos xlsx nativo, geramos um CSV robusto com todas as infos
 * 
 * @param {Object} params - Mesmo formato do PDF
 * @returns {string} - CSV content
 */
export const generateExcelCsv = (params) => {
  const {
    deviceName = 'Dispositivo',
    deviceId = '',
    dateRange = [],
    summary = {},
    chapters = [],
    events = [],
    bookmarks = [],
    points = [],
    i18n = {}
  } = params;
  
  const t = (key, fallback) => i18n[key] || fallback;
  const sep = ';'; // Separador para Excel BR
  const nl = '\r\n';
  
  let csv = '';
  
  // ========== SEÇÃO: RESUMO ==========
  csv += `=== ${t('report.summary', 'RESUMO')} ===${nl}`;
  csv += `${t('device.device', 'Dispositivo')}${sep}${deviceName}${nl}`;
  csv += `ID${sep}${deviceId}${nl}`;
  csv += `${t('report.period', 'Período')}${sep}${dateRange[0] ? formatDateTime(dateRange[0]) : ''} - ${dateRange[1] ? formatDateTime(dateRange[1]) : ''}${nl}`;
  csv += `${t('report.totalPoints', 'Total Pontos')}${sep}${summary.totalPoints || 0}${nl}`;
  csv += `${t('report.totalDistance', 'Distância Total')}${sep}${summary.totalDistanceKm || 0} km${nl}`;
  csv += `${t('report.tripDuration', 'Duração')}${sep}${summary.durationLabel || ''}${nl}`;
  csv += `${t('report.stopTime', 'Tempo Parado')}${sep}${summary.totalStopTimeLabel || ''}${nl}`;
  csv += `${t('report.movingTime', 'Em Movimento')}${sep}${summary.movingTimeLabel || ''} (${summary.movingPercent || 0}%)${nl}`;
  csv += `${t('report.stops', 'Paradas')}${sep}${summary.stopCount || 0}${nl}`;
  csv += `${t('report.speedEvents', 'Eventos Velocidade')}${sep}${summary.speedEventCount || 0}${nl}`;
  if (summary.maxSpeed) {
    csv += `${t('report.maxSpeed', 'Velocidade Máxima')}${sep}${summary.maxSpeed.value} km/h${nl}`;
  }
  csv += nl;
  
  // ========== SEÇÃO: CAPÍTULOS ==========
  if (chapters.length > 0) {
    csv += `=== ${t('report.chapters', 'TRECHOS')} ===${nl}`;
    csv += `#${sep}${t('report.startTime', 'Início')}${sep}${t('report.endTime', 'Fim')}${sep}${t('report.duration', 'Duração')}${sep}${t('report.distance', 'Distância')}${sep}${t('report.points', 'Pontos')}${sep}${t('report.startAddress', 'Origem')}${sep}${t('report.endAddress', 'Destino')}${nl}`;
    chapters.forEach(ch => {
      csv += `${ch.id}${sep}${ch.startTime}${sep}${ch.endTime}${sep}${ch.durationLabel}${sep}${ch.distanceKm} km${sep}${ch.pointCount}${sep}"${ch.startAddress}"${sep}"${ch.endAddress}"${nl}`;
    });
    csv += nl;
  }
  
  // ========== SEÇÃO: EVENTOS ==========
  const significantEvents = events.filter(e => !['start', 'end'].includes(e.type));
  if (significantEvents.length > 0) {
    csv += `=== ${t('report.events', 'EVENTOS')} ===${nl}`;
    csv += `${t('report.type', 'Tipo')}${sep}${t('report.index', 'Ponto')}${sep}${t('report.time', 'Hora')}${sep}${t('report.description', 'Descrição')}${sep}${t('report.address', 'Local')}${nl}`;
    significantEvents.forEach(ev => {
      const tipo = ev.type === 'stop' ? t('report.stop', 'Parada') : t('report.speeding', 'Velocidade');
      csv += `${tipo}${sep}${ev.index + 1}${sep}${ev.meta?.time ? formatTime(ev.meta.time) : ''}${sep}"${ev.label}"${sep}"${ev.meta?.address || ''}"${nl}`;
    });
    csv += nl;
  }
  
  // ========== SEÇÃO: BOOKMARKS ==========
  if (bookmarks.length > 0) {
    csv += `=== ${t('report.bookmarks', 'FAVORITOS')} ===${nl}`;
    csv += `${t('report.label', 'Nome')}${sep}${t('report.index', 'Ponto')}${sep}${t('report.time', 'Hora')}${sep}${t('report.address', 'Endereço')}${nl}`;
    bookmarks.forEach(bk => {
      csv += `"${bk.label}"${sep}${bk.index + 1}${sep}${bk.fixTime ? formatTime(bk.fixTime) : ''}${sep}"${bk.address}"${nl}`;
    });
    csv += nl;
  }
  
  // ========== SEÇÃO: PONTOS (limitado) ==========
  const maxPoints = 5000;
  const limitedPoints = points.slice(0, maxPoints);
  if (limitedPoints.length > 0) {
    csv += `=== ${t('report.points', 'PONTOS')} (${limitedPoints.length}${points.length > maxPoints ? ` de ${points.length}` : ''}) ===${nl}`;
    csv += `#${sep}${t('attribute.fixTime', 'Data/Hora')}${sep}${t('attribute.latitude', 'Latitude')}${sep}${t('attribute.longitude', 'Longitude')}${sep}${t('attribute.speed', 'Velocidade')}${sep}${t('attribute.address', 'Endereço')}${nl}`;
    limitedPoints.forEach((p, idx) => {
      csv += `${idx + 1}${sep}${formatDateTime(p.fixTime)}${sep}${p.latitude?.toFixed(6) || ''}${sep}${p.longitude?.toFixed(6) || ''}${sep}${p.speed?.toFixed(2) || 0}${sep}"${p.address || ''}"${nl}`;
    });
  }
  
  return csv;
};

// ============================================================================
// SHARE LINK
// ============================================================================

/**
 * Gera payload compactado para compartilhamento
 * 
 * @param {Object} params
 * @param {number} params.deviceId
 * @param {Date[]} params.dateRange
 * @param {Object} params.filters - { searchQuery, eventFilter, customSpeed, removeDuplicates }
 * @param {string} params.routeColor
 * @param {number} params.playbackSpeed
 * @param {boolean} params.followPlay
 * @param {number} [params.seekIndex] - Índice opcional para iniciar
 * @param {Array} [params.bookmarkIndexes] - Apenas índices dos bookmarks
 * @returns {string} - Encoded string para URL
 */
export const buildSharePayload = (params) => {
  const {
    deviceId,
    dateRange = [],
    filters = {},
    routeColor,
    playbackSpeed = 1,
    followPlay = true,
    seekIndex = null,
    bookmarkIndexes = []
  } = params;
  
  // Payload mínimo
  const payload = {
    d: deviceId,
    s: dateRange[0] ? new Date(dateRange[0]).getTime() : null,
    e: dateRange[1] ? new Date(dateRange[1]).getTime() : null,
    f: {
      q: filters.searchQuery || '',
      ev: filters.eventFilter || 'all',
      sp: filters.customSpeed || 80,
      rd: filters.removeDuplicates ? 1 : 0
    },
    c: routeColor || '#05a7e3',
    ps: playbackSpeed,
    fp: followPlay ? 1 : 0
  };
  
  // Adicionar seek index se especificado
  if (seekIndex !== null && seekIndex >= 0) {
    payload.si = seekIndex;
  }
  
  // Adicionar bookmarks se existirem (apenas índices para economizar espaço)
  if (bookmarkIndexes.length > 0) {
    payload.bk = bookmarkIndexes;
  }
  
  try {
    const jsonStr = JSON.stringify(payload);
    // Usar btoa com encoding para suportar UTF-8
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return encoded;
  } catch (e) {
    console.error('[buildSharePayload] Erro ao codificar:', e);
    return '';
  }
};

/**
 * Decodifica payload de compartilhamento
 * 
 * @param {string} encoded - String codificada da URL
 * @returns {Object|null} - Payload decodificado ou null
 */
export const parseSharePayload = (encoded) => {
  if (!encoded) return null;
  
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(jsonStr);
    
    // Converter de volta para formato legível
    return {
      deviceId: payload.d,
      dateRange: [
        payload.s ? new Date(payload.s) : null,
        payload.e ? new Date(payload.e) : null
      ],
      filters: {
        searchQuery: payload.f?.q || '',
        eventFilter: payload.f?.ev || 'all',
        customSpeed: payload.f?.sp || 80,
        removeDuplicates: payload.f?.rd === 1
      },
      routeColor: payload.c || '#05a7e3',
      playbackSpeed: payload.ps || 1,
      followPlay: payload.fp !== 0,
      seekIndex: payload.si ?? null,
      bookmarkIndexes: payload.bk || []
    };
  } catch (e) {
    console.error('[parseSharePayload] Erro ao decodificar:', e);
    return null;
  }
};

/**
 * Gera URL completa de compartilhamento
 * 
 * @param {string} baseUrl - URL base (window.location.origin + pathname)
 * @param {Object} params - Parâmetros para buildSharePayload
 * @returns {string} - URL completa
 */
export const generateShareUrl = (baseUrl, params) => {
  const encoded = buildSharePayload(params);
  if (!encoded) return '';
  
  // Usar hash para não depender de backend
  const url = new URL(baseUrl);
  url.searchParams.set('share', encoded);
  return url.toString();
};

// ============================================================================
// FASE 13: EXPORT KML (GOOGLE EARTH)
// ============================================================================

/**
 * Gera arquivo KML para Google Earth
 * 
 * @param {Array} points - Array de pontos com { latitude, longitude }
 * @param {string} deviceName - Nome do dispositivo
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @returns {string} - String KML válida
 */
export const generateKml = (points, deviceName, startDate, endDate) => {
  if (!points || points.length === 0) {
    return null;
  }
  
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  const routeName = `${deviceName} - ${startDateStr} a ${endDateStr}`;
  
  // Gerar coordenadas (longitude,latitude,altitude)
  const coordinates = points
    .map(p => `${p.longitude},${p.latitude},0`)
    .join('\n        ');
  
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeHtml(routeName)}</name>
    <description>Rota gerada pelo sistema de rastreamento</description>
    <Style id="routeStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f0000ff</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Rota de ${escapeHtml(deviceName)}</name>
      <description>Período: ${startDateStr} a ${endDateStr} | Pontos: ${points.length}</description>
      <styleUrl>#routeStyle</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
        ${coordinates}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
  
  return kml;
};

export default {
  generatePremiumPdfHtml,
  generateExcelCsv,
  buildSharePayload,
  parseSharePayload,
  generateShareUrl,
  generateKml
};
