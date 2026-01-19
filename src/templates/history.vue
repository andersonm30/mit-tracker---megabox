<template>
  <el-card class="history-card" shadow="hover">
  <div class="history-form">
  <el-form>
    <!-- Linha 1: Dispositivo -->
    <el-form-item>
      <div class="form-group">
        <label for="theInputDevice">{{ $t('device.select') }}</label>
        <el-select 
          v-model="formData.deviceId" 
          :value-key="'id'" 
          filterable 
          :placeholder="$t('device.device')" 
          :size="'large'" 
          :no-data-text="$t('NO_DATA_TEXT')" 
          :no-match-text="$t('NO_MATCH_TEXT')"
          aria-label="Selecionar dispositivo"
          @keyup.enter="handleFormEnter"
        >
          <el-option
            v-for="item in devicesList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
    </el-form-item>

    <!-- Linha 2: Período -->
    <el-form-item>
      <div class="form-group">
        <label>{{ $t('startDate') }}</label>
        <el-date-picker
          v-model="formData.date"
          type="datetimerange"
          :range-separator="$t('report.to')"
          :start-placeholder="$t('startDate')"
          :end-placeholder="$t('endDate')"
          :shortcuts="dateShortcuts"
          style="width: 100%;"
          aria-label="Selecionar período"
          @keyup.enter="handleFormEnter"
        />
      </div>
    </el-form-item>

    <!-- Linha 3: Opções de Visualização -->
    <div class="view-options">
      <span class="view-options-label">
        <i class="fas fa-eye"></i> {{ $t('report.visualization') }}:
      </span>
      <el-switch v-model="showRouteMarkers" :active-text="$t('report.showMarkers')" :disabled="isPlayingRoute" aria-label="Mostrar marcadores na rota" />
      <el-switch v-model="showHeatmap" :active-text="$t('report.showMapadeCalor')" :disabled="isPlayingRoute" aria-label="Mostrar mapa de calor" />
      
      <!-- Seletor de Cor da Rota -->
      <div class="route-color-selector">
        <span class="color-label">{{ $t('report.routeColor') }}:</span>
        <el-select 
          v-model="currentRouteColor" 
          size="small" 
          style="width: 130px;"
          :disabled="isPlayingRoute"
          @change="handleRouteColorChange"
        >
          <el-option
            v-for="option in routeColorOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span class="color-option">
              <span class="color-swatch" :style="{ backgroundColor: option.value }"></span>
              {{ option.label }}
            </span>
          </el-option>
        </el-select>
      </div>
    </div>
  </el-form>

  <!-- Linha 4: Ações (sticky) -->
  <div class="history-actions">
      <!-- FASE 11: Toggle de modo (só aparece se premium permitido) -->
      <el-tooltip 
        v-if="showModeToggle && filteredRoutePoints.length > 0" 
        :content="isPremiumMode ? $t('route.switchToBasic') || 'Modo Básico' : $t('route.switchToPremium') || 'Recursos Avançados'"
        placement="top"
      >
        <el-button 
          :type="isPremiumMode ? 'warning' : 'default'" 
          @click="toggleMode"
          circle
          size="small"
          style="margin-right: 8px;"
        >
          <i :class="isPremiumMode ? 'fas fa-star' : 'far fa-star'"></i>
        </el-button>
      </el-tooltip>
      
      <el-dropdown trigger="click" @command="handleExport" :disabled="!isFormValid">
        <el-button type="info" :disabled="!isFormValid">
          <i class="fas fa-download"></i> {{ $t('export.label') }}
          <i class="el-icon--right fas fa-angle-down"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <!-- Sempre visível: Export básico -->
            <el-dropdown-item command="pdf">
              <i class="fas fa-file-pdf"></i> {{ $t('report.pdf') }}
            </el-dropdown-item>
            <el-dropdown-item command="excel">
              <i class="fas fa-file-excel"></i> {{ $t('report.excel') }}
            </el-dropdown-item>
            
            <!-- Premium: só aparece se canUseExportPremium -->
            <el-dropdown-item 
              v-if="canUseExportPremium" 
              command="pdf-premium" 
              :disabled="filteredRoutePoints.length === 0"
              divided
            >
              <i class="fas fa-file-pdf"></i> {{ $t('report.pdfPremium') || 'PDF Premium' }} ⭐
            </el-dropdown-item>
            <el-dropdown-item 
              v-if="canUseExportPremium" 
              command="excel-premium" 
              :disabled="filteredRoutePoints.length === 0"
            >
              <i class="fas fa-file-excel"></i> {{ $t('report.excelPremium') || 'Excel Premium' }} ⭐
            </el-dropdown-item>
            
            <!-- Share Link: só aparece se canUseShareLink -->
            <el-dropdown-item 
              v-if="canUseShareLink" 
              divided 
              command="share" 
              :disabled="filteredRoutePoints.length === 0"
            >
              <i class="fas fa-share-alt"></i> {{ $t('report.shareLink') || 'Copiar Link' }}
            </el-dropdown-item>
            
            <!-- FASE 13: KML Export (Google Earth) - só aparece se ENABLE_EXPORT_KML -->
            <el-dropdown-item 
              v-if="isEnabled('ENABLE_EXPORT_KML')" 
              command="kml" 
              :disabled="filteredRoutePoints.length === 0"
            >
              <i class="fas fa-globe"></i> {{ $t('report.kml') || 'KML (Google Earth)' }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, $t('device.routes'))"
        type="primary" 
        @click="loadRoute()"
        :disabled="!isFormValid"
        :loading="isLoading"
        aria-label="Carregar rota no mapa"
      >
        <i v-if="!isLoading" class="fas fa-route"></i> {{ $t('report.show') }}
      </el-button>
      <el-button
        @mouseleave="hideTip" 
        @mouseenter.stop="showTip($event, $t('device.graphic'))"
        type="success" 
        @click="loadGraph()"
        :disabled="!isFormValid"
        aria-label="Abrir gráfico de velocidade"
      >
        <i class="fas fa-chart-bar"></i> {{ $t('report.chart') }}
      </el-button>
    </div>
  </div>
  </el-card> 

  <!-- ============================================================================
       FASE 12: ESTADOS VAZIOS (Modo BASIC - UX impecável)
       ============================================================================ -->
  
  <!-- Callout: Nenhum dispositivo selecionado -->
  <el-alert
    v-if="!formData.deviceId && loadingState !== 'loading'"
    :title="$t('route.selectDevicePrompt') || 'Selecione um dispositivo'"
    type="info"
    :description="$t('route.selectDeviceDesc') || 'Escolha um dispositivo na lista acima para visualizar o histórico de rotas.'"
    show-icon
    :closable="false"
    style="margin-top: 16px;"
  />

  <!-- Callout: Nenhum período selecionado -->
  <el-alert
    v-else-if="formData.deviceId && (!formData.date || !formData.date[0] || !formData.date[1]) && loadingState !== 'loading'"
    :title="$t('route.selectPeriodPrompt') || 'Selecione o período'"
    type="info"
    :description="$t('route.selectPeriodDesc') || 'Defina a data de início e fim para carregar o histórico de rotas.'"
    show-icon
    :closable="false"
    style="margin-top: 16px;"
  />

  <!-- Callout: Sem dados para o período (após carregar) -->
  <el-alert
    v-else-if="isFormValid && hasLoadedOnce && routePoints.length === 0 && loadingState === 'idle'"
    :title="$t('route.noDataTitle') || 'Sem dados para este período'"
    type="warning"
    :description="$t('route.noDataDesc') || 'Não há registros de posição para o dispositivo no período selecionado.'"
    show-icon
    :closable="false"
    style="margin-top: 16px;"
  >
    <template #default>
      <div class="empty-state-actions">
        <span class="empty-state-hint">{{ $t('route.tryAnotherPeriod') || 'Tente outro período:' }}</span>
        <el-button size="small" @click="setQuickPeriod(1)">{{ $t('route.last24h') || 'Últimas 24h' }}</el-button>
        <el-button size="small" @click="setQuickPeriod(7)">{{ $t('route.last7days') || 'Últimos 7 dias' }}</el-button>
        <el-button size="small" @click="setQuickPeriod(30)">{{ $t('route.last30days') || 'Últimos 30 dias' }}</el-button>
      </div>
    </template>
  </el-alert>

  <!-- Cartões de Estatísticas -->
  <el-card v-if="filteredRoutePoints.length > 0" class="stats-card" shadow="never">
    <template #header>
      <div class="stats-header">
        <div class="stats-title">
          <i class="fas fa-chart-line"></i> {{ $t('report.statistics') }}
        </div>
        <div v-if="currentDriverName" class="driver-pill">
          <i class="fas fa-user"></i> {{ $t('device.driver') }}: {{ currentDriverName }}
        </div>
      </div>
    </template>
    <div class="stats-container">
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-route stat-icon stat-icon-primary"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.totalDistance') }}</div>
            <div class="stat-value">{{ stats.totalDistance }} km</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-tachometer-alt stat-icon stat-icon-success"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.avgSpeed') }}</div>
            <div class="stat-value">{{ stats.avgSpeed }} km/h</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-clock stat-icon stat-icon-warning"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.tripDuration') }}</div>
            <div class="stat-value">{{ stats.duration }}</div>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-content">
          <i class="fas fa-pause-circle stat-icon stat-icon-danger"></i>
          <div class="stat-info">
            <div class="stat-label">{{ $t('report.stopTime') }}</div>
            <div class="stat-value">{{ stats.stopTime }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- FASE 12: Texto explicativo das estatísticas (modo BASIC) -->
    <div class="stats-disclaimer">
      <i class="fas fa-info-circle"></i>
      {{ $t('route.statsDisclaimer') || 'Estatísticas calculadas com base no percurso completo.' }}
    </div>
  </el-card>

  <!-- ============================================================================
       FASE 11: INSIGHTS AVANÇADOS (Premium Mode Only)
       Bloco único com tabs: Resumo | Capítulos | Favoritos
       ============================================================================ -->
  <el-card 
    v-if="isPremiumMode && canUseInsights && filteredRoutePoints.length > 0 && (routeSummary || routeChapters.length > 1 || bookmarkCount > 0)" 
    class="premium-insights-card" 
    shadow="never" 
    style="margin-top: 16px;"
  >
    <template #header>
      <div class="insights-header">
        <span><i class="fas fa-star"></i> {{ $t('route.advancedInsights') || 'Insights Avançados' }}</span>
        <el-tag type="warning" size="small" effect="dark">Premium</el-tag>
      </div>
    </template>
    
    <el-tabs v-model="insightsActiveTab" type="border-card" class="insights-tabs">
      
      <!-- Tab: Resumo Executivo -->
      <el-tab-pane 
        v-if="routeSummary" 
        name="summary" 
        :label="$t('report.executiveSummary') || 'Resumo Executivo'"
      >
        <template #label>
          <span><i class="fas fa-chart-pie"></i> {{ $t('report.summary') || 'Resumo' }}</span>
        </template>
        
        <div class="summary-grid">
          <!-- Tempo em Movimento vs Parado -->
          <div class="summary-item summary-item-highlight">
            <div class="summary-icon" style="--icon-color: var(--el-color-success);">
              <i class="fas fa-route"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ $t('report.movingTime') || 'Em Movimento' }}</div>
              <div class="summary-value">{{ routeSummary.movingTimeLabel }}</div>
              <div class="summary-percent">
                <div class="percent-bar">
                  <div class="percent-fill" :style="{ width: routeSummary.movingPercent + '%' }"></div>
                </div>
                <span>{{ routeSummary.movingPercent }}%</span>
              </div>
            </div>
          </div>
          
          <!-- Paradas -->
          <div class="summary-item" v-if="routeSummary.stopCount > 0">
            <div class="summary-icon" style="--icon-color: var(--el-color-warning);">
              <i class="fas fa-parking"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ $t('report.stops') || 'Paradas' }}</div>
              <div class="summary-value">{{ routeSummary.stopCount }} ({{ routeSummary.totalStopTimeLabel }})</div>
            </div>
          </div>
          
          <!-- Maior Parada -->
          <div 
            class="summary-item summary-item-clickable" 
            v-if="routeSummary.longestStop"
            @click="onSeekToIndex(routeSummary.longestStop.index)"
            :title="routeSummary.longestStop.address"
          >
            <div class="summary-icon" style="--icon-color: var(--el-color-danger);">
              <i class="fas fa-hourglass-half"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ $t('report.longestStop') || 'Maior Parada' }}</div>
              <div class="summary-value">{{ routeSummary.longestStop.durationLabel }}</div>
              <div class="summary-address">{{ routeSummary.longestStop.address }}</div>
            </div>
            <i class="fas fa-chevron-right summary-action"></i>
          </div>
          
          <!-- Velocidade Máxima -->
          <div 
            class="summary-item summary-item-clickable" 
            v-if="routeSummary.maxSpeed"
            @click="onSeekToIndex(routeSummary.maxSpeed.index)"
            :title="routeSummary.maxSpeed.address"
          >
            <div class="summary-icon" style="--icon-color: var(--el-color-danger);">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ $t('report.maxSpeed') || 'Velocidade Máxima' }}</div>
              <div class="summary-value">{{ routeSummary.maxSpeed.value }} km/h</div>
              <div class="summary-address">{{ routeSummary.maxSpeed.address }}</div>
            </div>
            <i class="fas fa-chevron-right summary-action"></i>
          </div>
          
          <!-- Eventos de Velocidade -->
          <div class="summary-item" v-if="routeSummary.speedEventCount > 0">
            <div class="summary-icon" style="--icon-color: var(--el-color-danger);">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ $t('report.speedEvents') || 'Excessos Velocidade' }}</div>
              <div class="summary-value">{{ routeSummary.speedEventCount }} {{ $t('report.events') || 'eventos' }}</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- Tab: Capítulos da Viagem -->
      <el-tab-pane 
        v-if="canUseChapters && routeChapters.length > 1" 
        name="chapters"
      >
        <template #label>
          <span><i class="fas fa-list-ol"></i> {{ $t('report.chapters') || 'Trechos' }} ({{ routeChapters.length }})</span>
        </template>
        
        <div class="chapters-list">
          <div 
            v-for="chapter in routeChapters" 
            :key="chapter.id"
            class="chapter-item"
            @click="onSeekToIndex(chapter.startIndex)"
          >
            <div class="chapter-number">{{ chapter.id }}</div>
            <div class="chapter-content">
              <div class="chapter-label">{{ chapter.label }}</div>
              <div class="chapter-details">
                <span><i class="fas fa-clock"></i> {{ chapter.durationLabel }}</span>
                <span><i class="fas fa-road"></i> {{ chapter.distanceKm }} km</span>
                <span><i class="fas fa-map-marker-alt"></i> {{ chapter.pointCount }} pts</span>
              </div>
              <div class="chapter-addresses">
                <span class="chapter-start">{{ chapter.startTime }} - {{ chapter.startAddress }}</span>
                <span class="chapter-end">{{ chapter.endTime }} - {{ chapter.endAddress }}</span>
              </div>
            </div>
            <i class="fas fa-play-circle chapter-action"></i>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- Tab: Favoritos / Bookmarks -->
      <el-tab-pane 
        v-if="canUseBookmarks && bookmarkCount > 0" 
        name="bookmarks"
      >
        <template #label>
          <span><i class="fas fa-star"></i> {{ $t('report.bookmarks') || 'Favoritos' }} ({{ bookmarkCount }})</span>
        </template>
        
        <div class="bookmarks-list">
          <div 
            v-for="bookmark in bookmarks" 
            :key="bookmark.index"
            class="bookmark-item"
            @click="onSeekToIndex(bookmark.index)"
          >
            <div class="bookmark-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="bookmark-content">
              <div class="bookmark-label">{{ bookmark.label }}</div>
              <div class="bookmark-address">{{ bookmark.address }}</div>
            </div>
            <i class="fas fa-chevron-right bookmark-action"></i>
          </div>
        </div>
      </el-tab-pane>
      
    </el-tabs>
  </el-card>

  <!-- Filtros da Timeline -->
  <el-card v-if="filteredRoutePoints.length > 0 || routePoints.length > 0" class="timeline-filters" shadow="never" style="margin-top: 16px;">
    <template #header>
      <div style="font-weight: bold;">
        <i class="fas fa-filter"></i> {{ $t('report.filters') }}
      </div>
    </template>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-search"></i> {{ $t('report.searchLabel') }}
          </label>
          <el-input
            v-model="searchQuery"
            :placeholder="$t('report.searchAddress')"
            :disabled="isPlayingRoute"
            clearable
          >
            <template #prefix>
              <i class="fas fa-search"></i>
            </template>
          </el-input>
        </div>
        <div style="min-width: 200px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-list"></i> {{ $t('report.eventType') }}
          </label>
          <el-select
            v-model="eventFilter"
            :placeholder="$t('report.filterByEvent')"
            :disabled="isPlayingRoute"
            style="width: 100%;"
            @change="onEventFilterChange"
          >
            <el-option :label="$t('report.all')" value="all" />
            <el-option :label="$t('report.moving')" value="moving" />
            <el-option :label="$t('report.stopped')" value="stopped" />
            <el-option :label="$t('report.fastSpeed')" value="fast" />
          </el-select>
        </div>
        <div v-if="eventFilter === 'fast'" style="min-width: 180px;">
          <label style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; display: block;">
            <i class="fas fa-tachometer-alt"></i> {{ $t('report.insertSpeed') }}
          </label>
          <el-input-number
            v-model="customSpeed"
            :min="1"
            :max="300"
            :controls="true"
            :disabled="isPlayingRoute"
            style="width: 100%;"
          />
          <span style="font-size: 11px; color: var(--el-text-color-secondary); margin-left: 4px;">km/h</span>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter);">
        <el-switch
          v-model="removeDuplicates"
          :active-text="$t('report.removeDuplicates')"
          :disabled="isPlayingRoute"
        />
        <div style="font-size: 13px; color: var(--el-text-color-regular); font-weight: 500;">
          <i class="fas fa-map-marker-alt"></i> 
          <span v-if="filteredRoutePoints.length !== routePoints.length">
            {{ filteredRoutePoints.length }} / {{ routePoints.length }} {{ $t('report.points') }}
          </span>
          <span v-else>
            {{ routePoints.length }} {{ $t('report.points') }}
          </span>
        </div>
      </div>
    </div>
  </el-card>

  <!-- Timeline Container -->
  <div class="timeline-container" :key="timelineKey">
    <template v-if="loadingState === 'loading'">
      <div class="timeline-message">
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{ $t('LOADING') }}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'export_ok'">
      <div class="timeline-message">
        <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 8px; color: var(--el-color-success);"></i>
        <div>{{ $t('device.ExportOK') }}</div>
      </div>
    </template>
    <template v-else-if="loadingState === 'error'">
      <div class="timeline-message" style="color: var(--el-color-danger);">
        <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
        <div>{{ $t('report.loadError') }}</div>
      </div>
    </template>
    <template v-else-if="filteredRoutePoints.length === 0">
      <div class="timeline-message">{{ $t('route.empty') }}</div>
    </template>
    <template v-else>
      <!-- [FIX BUG #2] Controles de reprodução REMOVIDOS - usar apenas o widget do mapa -->
      <!-- O controle unificado está em kore-map.vue (.modern-playback-widget) -->
      
      <!-- Ponto Inicial (Start) -->
      <TimelinePoint
        v-if="filteredRoutePoints.length > 0"
        :point="filteredRoutePoints[0]"
        :index="0"
        type="start"
        :speed-unit="speedUnit"
        :event="getEventAtIndex(0)"
        :bookmarked="isBookmarked(0)"
        @seek="onSeekToPoint"
        @toggle-bookmark="onToggleBookmark"
      />

      <!-- Pontos Intermediários (Middle) - Com Virtualização -->
      <div 
        v-if="filteredRoutePoints.length > 2" 
        ref="timelineScrollRef"
        class="timeline-scroll"
        @scroll="onTimelineScroll"
      >
        <!-- Spacer para altura total virtual -->
        <div :style="virtualScrollState.spacerStyle">
          <!-- Wrapper dos itens visíveis posicionado absolutamente -->
          <div :style="virtualScrollState.itemsWrapperStyle">
            <TimelinePoint
              v-for="{ item, realIndex } in visibleMiddlePoints"
              :key="item.id || realIndex"
              :point="item"
              :index="realIndex"
              type="middle"
              :is-active="isPlayingRoute && realIndex === currentPlayingPoint"
              :is-visited="isPlayingRoute && realIndex < currentPlayingPoint"
              :speed-unit="speedUnit"
              :event="getEventAtIndex(realIndex)"
              :bookmarked="isBookmarked(realIndex)"
              @seek="onSeekToPoint"
              @toggle-bookmark="onToggleBookmark"
            />
          </div>
        </div>
      </div>

      <!-- Ponto Final (End) -->
      <TimelinePoint
        v-if="filteredRoutePoints.length > 0"
        :point="filteredRoutePoints[filteredRoutePoints.length - 1]"
        :index="filteredRoutePoints.length - 1"
        type="end"
        :speed-unit="speedUnit"
        :event="getEventAtIndex(filteredRoutePoints.length - 1)"
        :bookmarked="isBookmarked(filteredRoutePoints.length - 1)"
        @seek="onSeekToPoint"
        @toggle-bookmark="onToggleBookmark"
      />
    </template>
  </div>
</template>

<script setup>
/**
 * history.vue - Componente de Histórico de Rotas
 * 
 * Refatorado para:
 * - Performance: Virtualização (windowing) para milhares de pontos
 * - Manutenibilidade: Subcomponentes TimelinePoint e PointAttributes
 * - Robustez: Controle de concorrência com requestId/AbortController
 * - Padronização: i18n consistente, sem strings hardcoded
 * - Timezone: Formatação correta de datas locais
 */

// Element Plus components
import 'element-plus/es/components/button/style/css';
import 'element-plus/es/components/icon/style/css';
import 'element-plus/es/components/tooltip/style/css';
import 'element-plus/es/components/form/style/css';
import 'element-plus/es/components/form-item/style/css';
import 'element-plus/es/components/select/style/css';
import 'element-plus/es/components/option/style/css';
import 'element-plus/es/components/switch/style/css';
import 'element-plus/es/components/input/style/css';
import 'element-plus/es/components/input-number/style/css';
import 'element-plus/es/components/message-box/style/css';
import 'element-plus/es/components/date-picker/style/css';
import 'element-plus/es/components/dropdown/style/css';
import 'element-plus/es/components/dropdown-menu/style/css';
import 'element-plus/es/components/dropdown-item/style/css';
import 'element-plus/es/components/card/style/css';
import 'element-plus/es/components/message/style/css';

import {
  ElButton, ElForm, ElSelect, ElOption, ElFormItem, ElSwitch, 
  ElInput, ElInputNumber, ElDatePicker, ElDropdown, 
  ElDropdownMenu, ElDropdownItem, ElCard, ElMessage
} from 'element-plus';

import { ref, inject, onMounted, watch, onBeforeUnmount, nextTick, computed, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRoute, onBeforeRouteLeave } from 'vue-router';

const runtimeApi = inject('runtimeApi', null);
if (!runtimeApi) throw new Error('Runtime API não disponível. Recarregue a página.');

// Subcomponentes locais
import TimelinePoint from './components/TimelinePoint.vue';

// [FIX BUG #2] Controles de reprodução movidos para widget único no mapa
// import RoutePlaybackControls from '@/components/RoutePlaybackControls.vue';

// FASE 7: Detector de eventos na rota
import { detectRouteEvents, createEventIndexMap } from '@/utils/routeEventDetector';

// FASE 8: Capítulos e Resumo da Rota
import { buildRouteChapters, buildRouteSummary } from '@/utils/routeChapters';

// FASE 8: Composable de Bookmarks
import { useRouteBookmarks } from '@/composables/useRouteBookmarks';

// FASE 9: Export Premium + Share
import { 
  generatePremiumPdfHtml, 
  generateExcelCsv,
  parseSharePayload,
  generateShareUrl,
  generateKml
} from '@/utils/routeExportPremium';

// FASE 10: Telemetria, Feature Flags, Fail-Safe
import { 
  startMeasure, 
  endMeasure,
  incrementCounter
} from '@/utils/routeTelemetry';
import { isEnabled, getFlag } from '@/utils/routeFeatureFlags';
import { 
  enforceLimits, 
  guardExport,
  limitEvents,
  limitChapters
} from '@/utils/routeFailSafe';

// FASE 11: Modo Basic vs Premium
import { useRouteMode } from '@/composables/useRouteMode';

// Composables
import { getDefaultDateRange, useRequestControl } from '@/composables/useRequestControl';

// ============================================
// CONFIGURAÇÃO
// ============================================
const PERF_DEBUG = process.env.NODE_ENV === 'development' && false;
const DEBUG_HISTORY = process.env.NODE_ENV === 'development';
const DEBOUNCE_DELAY = 250; // ms para debounce de filtros

// Configuração de virtualização
const virtualItemHeight = ref(65); // Altura dinâmica de cada ponto (medida em runtime)
const VIRTUAL_BUFFER = 8; // Itens extras acima/abaixo do viewport

// Controle de concorrência com useRequestControl (substitui sistema manual)
const { execute: safeRouteRequest } = useRequestControl();

// Helpers de log
const perfLog = (label, startTime, extra = '') => {
  if (!PERF_DEBUG) return;
  const elapsed = performance.now() - startTime;
  console.log(`[PERF:history] ${label}: ${elapsed.toFixed(2)}ms ${extra}`);
};

const debugLog = (...args) => {
  if (DEBUG_HISTORY) console.log('[History]', ...args);
};

// ============================================
// INJECTS E STORE
// ============================================
const store = useStore();
const route = useRoute();
const { proxy } = getCurrentInstance();

// FASE 12: Helper para tradução segura (fail-safe)
// Usa proxy.$t com fallback para a chave ou valor default
const safeT = (key, fallback = '') => {
  try {
    // Verificação mais robusta para garantir que proxy e $t existem
    const instance = proxy || getCurrentInstance()?.proxy;
    if (instance?.$t && typeof instance.$t === 'function') {
      const result = instance.$t(key);
      // Se retornou a própria chave, usar fallback
      if (result === key && fallback) return fallback;
      return result;
    }
    return fallback || key;
  } catch (error) {
    console.warn(`[safeT] Erro ao traduzir chave "${key}":`, error);
    return fallback || key;
  }
};

const showGraphicsRef = inject('show-graphics');
const showRouteMarkers = inject('showRouteMarkers');
const updateRoute = inject('updateRoute');
const toggleHeatmap = inject('toggleHeatmap');
const isPlayingRoute = inject('isPlayingRoute', ref(false)); // Fallback para ref(false)
const routeColorRef = inject('routeColor');
const setRouteColor = inject('setRouteColor');
const ROUTE_COLOR_OPTIONS = inject('ROUTE_COLOR_OPTIONS');

// PR#4: Inject clearAllOverlays para limpar mapa
const clearAllOverlays = inject('clearAllOverlays', null);

// FASE 4: Preview/Seek de ponto na timeline (vem do kore-map)
const previewRoutePoint = inject('previewRoutePoint', null);

// 1️⃣ CORREÇÃO: showHeatmap via inject com fallback (não redeclarar ref)
const injectedShowHeatmap = inject('showHeatmap', null);
const showHeatmap = injectedShowHeatmap ?? ref(false);

// ============================================
// REFS E ESTADO
// ============================================
const timelineScrollRef = ref(null);
const timelineKey = ref(0); // Key para forçar remount limpo

// Form data
const [defaultStart, defaultEnd] = getDefaultDateRange();
const formData = ref({ 
  deviceId: null, 
  date: [defaultStart, defaultEnd] 
});

// Estados de UI
const loadingState = ref('idle'); // 'idle' | 'loading' | 'export_ok' | 'error'
const searchQuery = ref('');
const eventFilter = ref('all');
const customSpeed = ref(80);
const removeDuplicates = ref(false);
// showHeatmap agora vem do inject acima

// Dados da rota
const routePoints = ref([]);

// Cor da rota
const currentRouteColor = ref(
  routeColorRef?.value || localStorage.getItem('kore-route-color') || '#05a7e3'
);

// Estado de loading
const isLoading = ref(false);

// FASE 12: Flag para saber se já carregou pelo menos uma vez
const hasLoadedOnce = ref(false);

// FASE 9: Playback settings (para share link)
const playbackSpeed = ref(1);
const followPlay = ref(true);

// ============================================
// FASE 11: MODO BASIC VS PREMIUM
// ============================================
const {
  isPremiumMode,
  showModeToggle,
  canUseInsights,
  canUseChapters,
  canUseBookmarks,
  canUseExportPremium,
  canUseShareLink,
  toggleMode
} = useRouteMode(store);

// Tab ativa no painel de Insights (premium)
const insightsActiveTab = ref('summary');

// Timer de debounce
let debounceTimer = null;

// ============================================
// VIRTUALIZAÇÃO (Windowing simples)
// ============================================
const virtualScrollTop = ref(0);

// 4️⃣ Altura dinâmica do container (medida no mount)
const containerHeight = ref(400);

// Pontos intermediários filtrados (sem primeiro e último)
const middlePoints = computed(() => {
  if (filteredRoutePoints.value.length <= 2) return [];
  return filteredRoutePoints.value.slice(1, -1);
});

// Estado da virtualização
const virtualScrollState = computed(() => {
  const totalItems = middlePoints.value.length;
  const totalHeight = totalItems * virtualItemHeight.value;
  
  // Usar altura medida dinamicamente
  const visibleCount = Math.ceil(containerHeight.value / virtualItemHeight.value) + 1;
  const startIndex = Math.max(0, Math.floor(virtualScrollTop.value / virtualItemHeight.value) - VIRTUAL_BUFFER);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + VIRTUAL_BUFFER * 2);
  const offsetTop = startIndex * virtualItemHeight.value;
  
  return {
    startIndex,
    endIndex,
    spacerStyle: {
      height: `${totalHeight}px`,
      position: 'relative'
    },
    itemsWrapperStyle: {
      position: 'absolute',
      top: `${offsetTop}px`,
      left: 0,
      right: 0
    }
  };
});

// Pontos visíveis (slice com índice real preservado)
const visibleMiddlePoints = computed(() => {
  const { startIndex, endIndex } = virtualScrollState.value;
  const points = middlePoints.value;
  
  return points.slice(startIndex, endIndex).map((item, i) => ({
    item,
    // +1 porque o primeiro ponto (start) tem índice 0
    realIndex: startIndex + i + 1
  }));
});

// Handler de scroll para virtualização
const onTimelineScroll = (event) => {
  virtualScrollTop.value = event.target.scrollTop;
};

// Scroll para ponto específico (sync com mapa)
const scrollToActivePoint = (index) => {
  if (!timelineScrollRef.value) return;
  
  // Ajustar índice para o container virtual (subtrair 1 pelo start)
  const virtualIndex = index - 1;
  const targetTop = virtualIndex * virtualItemHeight.value - (containerHeight.value / 2) + (virtualItemHeight.value / 2);
  
  // FASE 13.6.1: Micro-delay humano (16ms) - evita sensação robótica em playback rápido
  // FASE 13.6.2: Scroll suave com behavior 'smooth' (easing natural do browser)
  setTimeout(() => {
    if (!timelineScrollRef.value) return;
    timelineScrollRef.value.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth' // CSS scroll-behavior: smooth (ease-out perceptivo)
    });
  }, 16); // 1 frame em 60fps - timing humano
  
  debugLog(`Scroll para ponto ${index}`);
};

/**
 * FASE 4: Seek/Preview para um ponto da timeline
 * - Se estiver tocando: pula para o ponto e continua reprodução
 * - Se NÃO estiver tocando: apenas pré-visualiza (marker + panTo)
 * @param {number} realIndex - Índice real do ponto em filteredRoutePoints
 */
const onSeekToPoint = (realIndex) => {
  // Validar índice
  if (realIndex < 0 || realIndex >= filteredRoutePoints.value.length) {
    console.warn('[SEEK] Índice inválido:', realIndex);
    return;
  }
  
  const point = filteredRoutePoints.value[realIndex];
  if (!point) return;
  
  debugLog(`Seek para ponto ${realIndex}`, point);
  
  // Atualizar store para sincronizar timeline
  store.commit('devices/setRoutePlayPoint', realIndex);
  
  // Chamar preview no mapa (se provider existir)
  if (previewRoutePoint) {
    previewRoutePoint({ point, index: realIndex });
  }
  
  // Scroll para manter ponto visível na timeline
  scrollToActivePoint(realIndex);
};

// ============================================
// COMPUTED
// ============================================

// Ponto atual sendo reproduzido no mapa
const currentPlayingPoint = computed(() => {
  return store.state.devices?.routePlayPoint || 0;
});

// Unidade de velocidade do servidor
const speedUnit = computed(() => {
  return store.getters['server/getAttribute']('speedUnit', 'speedUnit');
});

// Lista de dispositivos normalizada
const devicesList = computed(() => {
  const raw =
    store.state.devices?.deviceList ??
    store.state.devices?.devicesList ??
    store.state.devices?.list ??
    store.state.devices?.devices ??
    [];

  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.list)) return raw.list;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
});

// Validação do formulário
const isFormValid = computed(() => {
  return !!(formData.value.deviceId && formData.value.date?.[0] && formData.value.date?.[1]);
});

// Dispositivo selecionado
const selectedDevice = computed(() => {
  const id = Number(formData.value.deviceId);
  if (!id) return null;
  return devicesList.value.find(d => Number(d.id) === id) || null;
});

// Nome do motorista atual
const currentDriverName = computed(() => {
  const dev = selectedDevice.value;
  if (!dev) return null;

  const posGetter = store.getters['devices/getPosition'];
  const pos = typeof posGetter === 'function' ? posGetter(dev.id) : null;
  const attrs = pos?.attributes ?? {};

  // ========================================
  // DRIVER RESOLUTION - REGRA PADRONIZADA
  // ========================================
  // Prioridade: driverUniqueId > rfid (SÓ SE rfidStatus === 'VALID') > device fallback
  // NUNCA usar rfid direto se status é INVALID/UNKNOWN
  const driverUniqueId = attrs.driverUniqueId || null;
  const rfid = attrs.rfid || null;
  const rfidStatus = attrs.rfidStatus || null;
  
  // Montar driver efetivo
  let effectiveDriverId = driverUniqueId;
  let effectiveSource = driverUniqueId ? 'driverUniqueId' : null;
  
  // Fallback para rfid SOMENTE se status é VALID
  if (!effectiveDriverId && rfid && rfidStatus === 'VALID') {
    effectiveDriverId = rfid;
    effectiveSource = 'rfid_valid';
  }
  
  // Último fallback: device.attributes
  if (!effectiveDriverId && dev?.attributes?.driverUniqueId) {
    effectiveDriverId = dev.attributes.driverUniqueId;
    effectiveSource = 'device_fallback';
  }

  // 🔍 DEBUG: Log apenas em dev
  if (process.env.NODE_ENV === 'development' || window.DEBUG_DRIVER_LOOKUP) {
    console.log('[history/currentDriverName]', {
      deviceId: dev.id,
      positionId: pos?.id,
      driverUniqueId,
      rfid,
      rfidStatus,
      effectiveDriverId,
      effectiveSource
    });
  }

  if (!effectiveDriverId) return null;

  // Tentar getters do store
  const byUnique = store.getters['drivers/getDriverByUniqueId'];
  if (effectiveDriverId && typeof byUnique === 'function') {
    const d = byUnique(effectiveDriverId);
    if (d) return d.name || d.uniqueId || effectiveDriverId;
  }

  // Fallback: buscar em listas do state
  const driversRaw = store.state.drivers?.driversList ?? store.state.drivers?.list ?? [];
  const drivers = Array.isArray(driversRaw) ? driversRaw : Object.values(driversRaw || {});

  if (effectiveDriverId) {
    const d = drivers.find(x => x?.uniqueId === effectiveDriverId);
    if (d) return d.name || d.uniqueId || effectiveDriverId;
  }

  return effectiveDriverId;
});

// Pontos filtrados (busca, tipo de evento, duplicatas)
const filteredRoutePoints = computed(() => {
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  // HARDENING: Spread para garantir imutabilidade real (evita bug se alguém mutar routePoints)
  let points = [...routePoints.value];
  
  // Filtrar por endereço
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    points = points.filter(p => 
      (p.address && p.address.toLowerCase().includes(search)) ||
      `${p.latitude},${p.longitude}`.includes(search)
    );
  }
  
  // Filtrar por tipo de evento
  if (eventFilter.value === 'moving') {
    points = points.filter(p => p.speed > 1);
  } else if (eventFilter.value === 'stopped') {
    points = points.filter(p => p.speed <= 1);
  } else if (eventFilter.value === 'fast') {
    points = points.filter(p => p.speed >= customSpeed.value);
  }
  
  // Remover duplicatas se habilitado
  if (removeDuplicates.value && points.length > 0) {
    const uniquePoints = [];
    let lastPoint = null;
    
    for (const point of points) {
      if (!lastPoint || 
          lastPoint.latitude !== point.latitude || 
          lastPoint.longitude !== point.longitude) {
        uniquePoints.push(point);
        lastPoint = point;
      }
    }
    points = uniquePoints;
  }
  
  perfLog('filteredRoutePoints', perfStart, `input:${routePoints.value.length} output:${points.length}`);
  return points;
});

// Estatísticas calculadas (memoizadas)
const stats = computed(() => {
  if (routePoints.value.length === 0) {
    return { totalDistance: '0.00', avgSpeed: '0.00', duration: '0h 0m', stopTime: '0h 0m' };
  }
  
  return {
    totalDistance: calculateTotalDistance(),
    avgSpeed: calculateAvgSpeed(),
    duration: calculateDuration(),
    stopTime: calculateStopTime()
  };
});

// ============================================================================
// FASE 7: DETECÇÃO DE EVENTOS NA ROTA
// ============================================================================

/**
 * Eventos detectados na rota (paradas, excesso de velocidade, início/fim)
 * Usa os pontos filtrados para manter sincronização com a timeline
 */
const routeEvents = computed(() => {
  // FASE 10: Feature flag guard
  if (!isEnabled('ENABLE_EVENTS')) return [];
  
  const points = filteredRoutePoints.value;
  if (points.length < 2) return [];
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  startMeasure('detectEvents');
  
  let events = detectRouteEvents(points, {
    stopMinMinutes: 10,      // Paradas > 10 minutos
    speedLimit: customSpeed.value, // Usa o limite configurável do filtro
    detectStops: true,
    detectSpeed: true,
    detectStartEnd: true,
    detectIgnition: false,   // Habilitar se tiver dados de ignição
  });
  
  // FASE 10: Limitar eventos para performance
  events = limitEvents(events);
  
  endMeasure('detectEvents', { count: events.length });
  perfLog('routeEvents', perfStart, `detected:${events.length}`);
  return events;
});

/**
 * Mapa de índice -> eventos para lookup O(1)
 * Usado para marcar pontos da timeline que têm eventos
 */
const routeEventIndexMap = computed(() => {
  return createEventIndexMap(routeEvents.value);
});

/**
 * Verifica se um ponto tem evento associado
 * @param {number} index - Índice do ponto
 * @returns {Object|null} - Primeiro evento no índice ou null
 */
const getEventAtIndex = (index) => {
  const events = routeEventIndexMap.value.get(index);
  return events?.[0] || null;
};

// ============================================================================
// FASE 8: RESUMO EXECUTIVO + CAPÍTULOS + BOOKMARKS
// ============================================================================

/**
 * Resumo executivo da rota
 * Contém estatísticas agregadas: paradas, velocidade máxima, tempo em movimento, etc.
 */
const routeSummary = computed(() => {
  // FASE 10: Feature flag guard
  if (!isEnabled('ENABLE_SUMMARY')) return null;
  
  const points = filteredRoutePoints.value;
  const events = routeEvents.value;
  
  if (points.length < 2) return null;
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  startMeasure('buildSummary');
  const summary = buildRouteSummary(points, events);
  endMeasure('buildSummary');
  perfLog('routeSummary', perfStart);
  
  return summary;
});

/**
 * Capítulos da viagem (segmentação por paradas longas)
 */
const routeChapters = computed(() => {
  // FASE 10: Feature flag guard
  if (!isEnabled('ENABLE_CHAPTERS')) return [];
  
  const points = filteredRoutePoints.value;
  const events = routeEvents.value;
  
  if (points.length < 2) return [];
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  startMeasure('buildChapters');
  let chapters = buildRouteChapters(points, events, {
    minStopMinutes: 10 // Mesma config do detector de eventos
  });
  
  // FASE 10: Limitar capítulos para performance
  chapters = limitChapters(chapters);
  
  endMeasure('buildChapters', { count: chapters.length });
  perfLog('routeChapters', perfStart, `chapters:${chapters.length}`);
  
  return chapters;
});

/**
 * Bookmarks da rota atual
 */
const {
  bookmarks,
  bookmarkCount,
  isBookmarked,
  toggleBookmark
} = useRouteBookmarks(computed(() => formData.value.deviceId));

/**
 * Handler para toggle de bookmark emitido pelo TimelinePoint
 */
const onToggleBookmark = (point, index) => {
  toggleBookmark(point, index);
};

/**
 * Handler para seek a partir de bookmark ou capítulo
 */
const onSeekToIndex = (index) => {
  onSeekToPoint(index);
};

// Opções de cores da rota (i18n)
const colorKeyMap = {
  '#05a7e3': 'colorBlue',
  '#FF5733': 'colorOrange',
  '#28a745': 'colorGreen',
  '#dc3545': 'colorRed',
  '#6f42c1': 'colorPurple',
  '#fd7e14': 'colorYellow',
  '#20c997': 'colorTurquoise',
  '#e83e8c': 'colorPink'
};

const routeColorOptions = computed(() => {
  const baseOptions = ROUTE_COLOR_OPTIONS || [
    { value: '#05a7e3' },
    { value: '#FF5733' },
    { value: '#28a745' },
    { value: '#dc3545' },
    { value: '#6f42c1' },
    { value: '#fd7e14' },
    { value: '#20c997' },
    { value: '#e83e8c' }
  ];
  return baseOptions.map(opt => ({
    value: opt.value,
    label: safeT(`report.${colorKeyMap[opt.value] || 'colorBlue'}`)
  }));
});

// Atalhos de data - Computed para garantir que i18n está disponível
const dateShortcuts = computed(() => [
  {
    text: safeT('now', 'Hoje'),
    value: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return [start, new Date()];
    }
  },
  {
    text: safeT('report.yesterday', 'Ontem'),
    value: () => {
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: safeT('report.lastWeek', 'Última semana'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: safeT('report.lastMonth', 'Último mês'),
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  }
]);

// ============================================
// MÉTODOS
// ============================================

const showTip = (evt, text) => window.$showTip?.(evt, text);
const hideTip = (evt, text) => window.$hideTip?.(evt, text);

// Sync form com store de reports
const sendDataToStore = () => {
  const { deviceId, date } = formData.value;
  if (!deviceId || !date?.[0] || !date?.[1]) return;
  store.dispatch('reports/updateReportData', { deviceId, date: [date[0], date[1]] });
};

// Validação antes de carregar/exportar
// FASE 12: Validação mais humana - corrige automaticamente quando possível
const validateForm = () => {
  if (!formData.value.deviceId) {
    ElMessage.warning(safeT('report.selectDevice', 'Selecione um dispositivo'));
    return false;
  }
  
  if (!formData.value.date?.[0] || !formData.value.date?.[1]) {
    ElMessage.warning(safeT('report.selectPeriod', 'Selecione o período'));
    return false;
  }
  
  let startDate = new Date(formData.value.date[0]);
  let endDate = new Date(formData.value.date[1]);
  
  // FASE 12: Se datas invertidas, corrigir automaticamente
  if (endDate <= startDate) {
    // Swap automático das datas
    formData.value.date = [formData.value.date[1], formData.value.date[0]];
    startDate = new Date(formData.value.date[0]);
    endDate = new Date(formData.value.date[1]);
    ElMessage.info(safeT('route.datesSwapped', 'Datas ajustadas automaticamente.'));
  }
  
  const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  
  // FASE 12: Se período > 31 dias, avisar mas não bloquear
  if (diffDays > 31) {
    ElMessage.warning(
      safeT('route.periodTooLong', 'O período selecionado tem {days} dias. Períodos longos podem demorar mais para carregar.')
        .replace('{days}', Math.ceil(diffDays))
    );
    // Não retorna false - permite continuar
  }
  
  return true;
};

// FASE 12: Handler para Enter no formulário
const handleFormEnter = () => {
  if (isFormValid.value && !isLoading.value) {
    loadRoute();
  }
};

// FASE 12: Definir período rápido (para estados vazios)
const setQuickPeriod = (days) => {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  formData.value.date = [start, end];
  
  ElMessage.success(
    safeT('route.periodSet', 'Período definido: últimos {days} dias')
      .replace('{days}', days)
  );
};

// Atualizar rota no mapa com pontos filtrados
const updateMapRoute = () => {
  // HARDENING RISCO 7: Filtrar pontos inválidos antes de enviar ao mapa
  // FIX: Passar objetos COMPLETOS para preservar address, attributes, speed, etc.
  // O kore-map.vue precisa desses dados para o painel "Detalhes do Ponto"
  const validPoints = filteredRoutePoints.value
    .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  
  if (validPoints.length === 0) {
    console.warn('[history] Nenhum ponto válido para desenhar rota');
    return;
  }
  
  // HARDENING RISCO 1: Guard contra updateRoute não disponível
  if (typeof updateRoute === 'function') {
    // Passar objetos completos + deviceId para ícone correto do playback
    updateRoute(validPoints, true, formData.value.deviceId);
  } else {
    console.warn('[history] updateRoute não disponível (mapa não montado?)');
  }
};

// Carregar rota do backend (com controle de concorrência via useRequestControl)
const loadRoute = async (showGraphAfter = false) => {
  // [DEBUG] Log para verificar chamadas duplicadas - remover após validação
  console.count('[history] loadRoute()');
  
  if (!validateForm()) return;
  
  // Garantir que runtimeApi está disponível
  if (!runtimeApi?.loadRoute) {
    console.error('[history] runtimeApi.loadRoute não disponível');
    ElMessage.error(safeT('report.apiUnavailable', 'API não disponível. Recarregue a página.'));
    return;
  }
  
  // FASE 10: Iniciar medição de telemetria
  startMeasure('loadRoute');
  incrementCounter('loadRoute_calls');
  
  const perfStart = PERF_DEBUG ? performance.now() : 0;
  loadingState.value = 'loading';
  isLoading.value = true;
  
  // Incrementar key para forçar remount limpo do container
  timelineKey.value++;
  
  const deviceId = formData.value.deviceId;
  const startDate = formData.value.date[0];
  const endDate = formData.value.date[1];
  
  debugLog(`loadRoute: device=${deviceId}, start=${startDate}, end=${endDate}`);
  
  try {
    // PR#4: Limpar overlays antigos ANTES de carregar nova rota
    // PATCH 5: scope 'history' para não apagar overlays de outras features
    if (clearAllOverlays) {
      clearAllOverlays({ reason: 'load-new-route', scope: 'history' });
    }
    
    // Executar request com proteção de concorrência
    const result = await safeRouteRequest(async ({ signal }) => {
      return await runtimeApi.loadRoute(deviceId, startDate, endDate, false, { signal });
    });
    
    // Se abortado ou componente desmontado
    if (!result || !result.success) {
      debugLog(`loadRoute abortado ou falhou`);
      return;
    }
    
    const response = result.data;
    
    perfLog('loadRoute API', perfStart, `points:${response.data?.length || response.length}`);
    
    // FASE 10: Verificar limites e aplicar fail-safe
    const rawData = response.data || response;
    const { points: safePoints, truncated, warning } = enforceLimits(rawData, {
      warningLimit: getFlag('MAX_POINTS_WARNING'),
      hardLimit: getFlag('MAX_POINTS_HARD_LIMIT')
    });
    
    if (warning) {
      ElMessage.warning(warning);
    }
    
    routePoints.value = safePoints;
    updateMapRoute();
    
    // FASE 12: Marcar que já carregou pelo menos uma vez
    hasLoadedOnce.value = true;
    
    // Ocultar outros devices para focar neste
    await nextTick();
    store.dispatch('devices/setDeviceFilter', deviceId);
    
    virtualScrollTop.value = 0; // Reset scroll virtual
    
    // FASE 10: Finalizar medição
    endMeasure('loadRoute', { points: safePoints.length, truncated });
    
    perfLog('loadRoute render', perfStart);
    
    // FASE 13.2: Re-medir altura após render dos novos pontos
    measureItemHeight();
    
    // Mostrar gráfico se solicitado
    if (showGraphAfter && safePoints.length > 0) {
      loadGraph();
    }
  } catch (err) {
    console.error('[history] loadRoute error:', err);
    ElMessage.error(safeT('report.loadError', 'Erro ao carregar rota.'));
  } finally {
    // GARANTIR que loadingState SEMPRE volte para idle
    loadingState.value = 'idle';
    isLoading.value = false;
  }
};

// Carregar gráfico
const loadGraph = () => {
  if (routePoints.value.length === 0) {
    loadRoute(true);
  } else {
    showGraphicsRef.value?.showGraphic(routePoints.value);
  }
};

// Handler de mudança de cor da rota
const handleRouteColorChange = (color) => {
  setRouteColor?.(color);
  debugLog('Cor da rota alterada:', color);
};

// Handler de filtro de eventos
const onEventFilterChange = () => {
  if (filteredRoutePoints.value.length > 0) {
    updateMapRoute();
  }
};

// ============================================
// EXPORT: CSV e PDF
// ============================================

const getDeviceName = (deviceId) => {
  const device = devicesList.value.find(d => Number(d.id) === Number(deviceId));
  return device?.name || `Device ${deviceId}`;
};

const formatDateForFilename = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const exportCsv = () => {
  if (!guardExport(filteredRoutePoints.value, (msg) => ElMessage.warning(msg))) {
    return;
  }
  
  // PATCH 9: Limite de segurança para CSV (50k pontos)
  const MAX_CSV_POINTS = 50000;
  if (filteredRoutePoints.value.length > MAX_CSV_POINTS) {
    ElMessage.warning(`Limite de ${MAX_CSV_POINTS.toLocaleString()} pontos para CSV. Use filtros para reduzir.`);
    return;
  }
  
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDate = formatDateForFilename(formData.value.date[0]);
  const endDate = formatDateForFilename(formData.value.date[1]);
  
  const headers = [
    safeT('attribute.fixTime', 'Data/Hora'),
    safeT('device.device', 'Dispositivo'),
    safeT('attribute.latitude', 'Latitude'),
    safeT('attribute.longitude', 'Longitude'),
    safeT('attribute.speed', 'Velocidade (km/h)'),
    safeT('attribute.course', 'Curso'),
    safeT('attribute.address', 'Endereço')
  ];
  
  const rows = filteredRoutePoints.value.map(p => {
    const fixTime = new Date(p.fixTime).toLocaleString('pt-BR');
    return [
      escapeCsvValue(fixTime),
      escapeCsvValue(deviceName),
      escapeCsvValue(p.latitude),
      escapeCsvValue(p.longitude),
      escapeCsvValue(p.speed?.toFixed(2) || '0.00'),
      escapeCsvValue(p.course || ''),
      escapeCsvValue(p.address || '')
    ].join(';');
  });
  
  const BOM = '\ufeff';
  const csv = BOM + headers.join(';') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `percurso_${deviceId}_${startDate}_${endDate}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success(safeT('device.ExportOK', 'Arquivo exportado com sucesso'));
};

const exportPrintPdf = () => {
  if (!guardExport(filteredRoutePoints.value, (msg) => ElMessage.warning(msg))) {
    return;
  }
  
  // PATCH 9: Limite de segurança para PDF (5k pontos - HTML pesado)
  const MAX_PDF_POINTS = 5000;
  if (filteredRoutePoints.value.length > MAX_PDF_POINTS) {
    ElMessage.warning(`PDF limitado a ${MAX_PDF_POINTS.toLocaleString()} pontos. Use CSV para dados completos ou aplique filtros.`);
    return;
  }
  
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDateStr = new Date(formData.value.date[0]).toLocaleString('pt-BR');
  const endDateStr = new Date(formData.value.date[1]).toLocaleString('pt-BR');
  
  const { totalDistance, avgSpeed, duration, stopTime } = stats.value;
  
  const tableRows = filteredRoutePoints.value.map((p, idx) => {
    const fixTime = new Date(p.fixTime).toLocaleString('pt-BR');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${fixTime}</td>
        <td>${p.latitude?.toFixed(6) || ''}</td>
        <td>${p.longitude?.toFixed(6) || ''}</td>
        <td>${p.speed?.toFixed(2) || '0.00'}</td>
        <td>${p.address || '-'}</td>
      </tr>
    `;
  }).join('');
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${safeT('report.history', 'Relatório de Percurso')} - ${deviceName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
    .header h1 { font-size: 18px; margin-bottom: 5px; }
    .header .subtitle { font-size: 14px; color: #666; }
    .info { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .info-item { flex: 1; }
    .info-item strong { display: block; color: #333; }
    .stats { display: flex; gap: 15px; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .stat-box { flex: 1; text-align: center; }
    .stat-box .value { font-size: 16px; font-weight: bold; color: #2196F3; }
    .stat-box .label { font-size: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #4CAF50; color: white; font-size: 11px; }
    td { font-size: 10px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; }
    @media print {
      body { padding: 10px; }
      .header { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${safeT('report.history', 'Relatório de Percurso')}</h1>
    <div class="subtitle">${safeT('report.generatedAt', 'Gerado em')} ${new Date().toLocaleString('pt-BR')}</div>
  </div>
  <div class="info">
    <div class="info-item"><strong>${safeT('device.device', 'Dispositivo')}:</strong> ${deviceName} (ID: ${deviceId})</div>
    <div class="info-item"><strong>${safeT('report.period', 'Período')}:</strong> ${startDateStr} ${safeT('report.to', 'a')} ${endDateStr}</div>
    <div class="info-item"><strong>${safeT('report.points', 'Pontos')}:</strong> ${filteredRoutePoints.value.length}</div>
  </div>
  <div class="stats">
    <div class="stat-box"><div class="value">${totalDistance} km</div><div class="label">${safeT('report.totalDistance', 'Distância Total')}</div></div>
    <div class="stat-box"><div class="value">${avgSpeed} km/h</div><div class="label">${safeT('report.avgSpeed', 'Velocidade Média')}</div></div>
    <div class="stat-box"><div class="value">${duration}</div><div class="label">${safeT('report.tripDuration', 'Duração')}</div></div>
    <div class="stat-box"><div class="value">${stopTime}</div><div class="label">${safeT('report.stopTime', 'Tempo Parado')}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>${safeT('attribute.fixTime', 'Data/Hora')}</th><th>${safeT('attribute.latitude', 'Latitude')}</th><th>${safeT('attribute.longitude', 'Longitude')}</th><th>${safeT('attribute.speed', 'Velocidade')}</th><th>${safeT('attribute.address', 'Endereço')}</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">${safeT('report.footer', 'Sistema de Rastreamento - Relatório gerado automaticamente')}</div>
</body>
</html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  } else {
    ElMessage.error(safeT('report.popupBlocked', 'Bloqueador de pop-ups ativo. Permita pop-ups para exportar.'));
  }
};

const handleExport = (command) => {
  // FASE 10: Telemetria
  incrementCounter('export_' + command);
  
  if (command === 'pdf') exportPrintPdf();
  else if (command === 'pdf-premium') {
    if (!isEnabled('ENABLE_EXPORT_PREMIUM')) {
      ElMessage.info('Recurso desabilitado');
      return;
    }
    exportPdfPremium();
  }
  else if (command === 'excel') exportCsv();
  else if (command === 'excel-premium') {
    if (!isEnabled('ENABLE_EXPORT_PREMIUM')) {
      ElMessage.info('Recurso desabilitado');
      return;
    }
    exportExcelPremium();
  }
  else if (command === 'share') {
    if (!isEnabled('ENABLE_SHARE')) {
      ElMessage.info('Recurso desabilitado');
      return;
    }
    copyShareLink();
  }
  else if (command === 'kml') {
    if (!isEnabled('ENABLE_EXPORT_KML')) {
      ElMessage.info('Recurso desabilitado');
      return;
    }
    exportKml();
  }
};

// ============================================
// FASE 9: EXPORT PREMIUM + SHARE
// ============================================

/**
 * Export PDF Premium com Summary, Chapters, Events, Bookmarks
 */
const exportPdfPremium = () => {
  // FASE 10: Guard com fail-safe
  if (!guardExport(filteredRoutePoints.value, (msg) => ElMessage.warning(msg))) {
    return;
  }
  if (!validateForm()) return;
  
  startMeasure('exportPdfPremium');
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  
  // Montar payload para o gerador
  const params = {
    deviceName,
    deviceId,
    dateRange: formData.value.date,
    summary: routeSummary.value,
    chapters: routeChapters.value,
    events: routeEvents.value,
    bookmarks: bookmarks.value,
    stats: stats.value,
    i18n: {
      'report.premiumReport': safeT('report.premiumReport', 'Relatório de Percurso Premium'),
      'report.generatedAt': safeT('report.generatedAt', 'Gerado em'),
      'report.period': safeT('report.period', 'Período'),
      'report.to': safeT('report.to', 'a'),
      'report.totalPoints': safeT('report.totalPoints', 'Total de Pontos'),
      'report.chapters': safeT('report.chapters', 'Trechos'),
      'report.events': safeT('report.events', 'Eventos'),
      'report.totalDistance': safeT('report.totalDistance', 'Distância Total'),
      'report.avgSpeed': safeT('report.avgSpeed', 'Velocidade Média'),
      'report.tripDuration': safeT('report.tripDuration', 'Duração Total'),
      'report.stopTime': safeT('report.stopTime', 'Tempo Parado'),
      'report.longestStop': safeT('report.longestStop', 'Maior Parada'),
      'report.maxSpeed': safeT('report.maxSpeed', 'Velocidade Máxima'),
      'report.startTime': safeT('report.startTime', 'Início'),
      'report.endTime': safeT('report.endTime', 'Fim'),
      'report.duration': safeT('report.duration', 'Duração'),
      'report.distance': safeT('report.distance', 'Distância'),
      'report.startAddress': safeT('report.startAddress', 'Origem'),
      'report.endAddress': safeT('report.endAddress', 'Destino'),
      'report.type': safeT('report.type', 'Tipo'),
      'report.index': safeT('report.index', 'Ponto'),
      'report.time': safeT('report.time', 'Hora'),
      'report.description': safeT('report.description', 'Descrição'),
      'report.address': safeT('report.address', 'Local'),
      'report.stop': safeT('report.stop', 'Parada'),
      'report.speeding': safeT('report.speeding', 'Velocidade'),
      'report.bookmarks': safeT('report.bookmarks', 'Pontos Favoritos'),
      'report.label': safeT('report.label', 'Nome'),
      'report.footer': safeT('report.footer', 'Relatório gerado automaticamente')
    },
    systemName: 'KORE GPS'
  };
  
  const html = generatePremiumPdfHtml(params);
  
  // Abrir em nova janela
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.error(safeT('report.popupBlocked', 'Popup bloqueado'));
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  
  endMeasure('exportPdfPremium', { points: filteredRoutePoints.value.length });
  ElMessage.success(safeT('report.pdfPremiumGenerated', 'PDF Premium gerado'));
};

/**
 * Export Excel Premium (CSV multi-seção)
 */
const exportExcelPremium = () => {
  // FASE 10: Guard com fail-safe
  if (!guardExport(filteredRoutePoints.value, (msg) => ElMessage.warning(msg))) {
    return;
  }
  if (!validateForm()) return;
  
  startMeasure('exportExcelPremium');
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDate = formatDateForFilename(formData.value.date[0]);
  const endDate = formatDateForFilename(formData.value.date[1]);
  
  const params = {
    deviceName,
    deviceId,
    dateRange: formData.value.date,
    summary: routeSummary.value,
    chapters: routeChapters.value,
    events: routeEvents.value,
    bookmarks: bookmarks.value,
    points: filteredRoutePoints.value,
    i18n: {
      'report.summary': safeT('report.summary', 'RESUMO'),
      'device.device': safeT('device.device', 'Dispositivo'),
      'report.period': safeT('report.period', 'Período'),
      'report.totalPoints': safeT('report.totalPoints', 'Total Pontos'),
      'report.totalDistance': safeT('report.totalDistance', 'Distância Total'),
      'report.tripDuration': safeT('report.tripDuration', 'Duração'),
      'report.stopTime': safeT('report.stopTime', 'Tempo Parado'),
      'report.movingTime': safeT('report.movingTime', 'Em Movimento'),
      'report.stops': safeT('report.stops', 'Paradas'),
      'report.speedEvents': safeT('report.speedEvents', 'Eventos Velocidade'),
      'report.maxSpeed': safeT('report.maxSpeed', 'Velocidade Máxima'),
      'report.chapters': safeT('report.chapters', 'TRECHOS'),
      'report.startTime': safeT('report.startTime', 'Início'),
      'report.endTime': safeT('report.endTime', 'Fim'),
      'report.duration': safeT('report.duration', 'Duração'),
      'report.distance': safeT('report.distance', 'Distância'),
      'report.points': safeT('report.points', 'Pontos'),
      'report.startAddress': safeT('report.startAddress', 'Origem'),
      'report.endAddress': safeT('report.endAddress', 'Destino'),
      'report.events': safeT('report.events', 'EVENTOS'),
      'report.type': safeT('report.type', 'Tipo'),
      'report.index': safeT('report.index', 'Ponto'),
      'report.time': safeT('report.time', 'Hora'),
      'report.description': safeT('report.description', 'Descrição'),
      'report.address': safeT('report.address', 'Local'),
      'report.stop': safeT('report.stop', 'Parada'),
      'report.speeding': safeT('report.speeding', 'Velocidade'),
      'report.bookmarks': safeT('report.bookmarks', 'FAVORITOS'),
      'report.label': safeT('report.label', 'Nome'),
      'attribute.fixTime': safeT('attribute.fixTime', 'Data/Hora'),
      'attribute.latitude': safeT('attribute.latitude', 'Latitude'),
      'attribute.longitude': safeT('attribute.longitude', 'Longitude'),
      'attribute.speed': safeT('attribute.speed', 'Velocidade'),
      'attribute.address': safeT('attribute.address', 'Endereço')
    }
  };
  
  const csv = generateExcelCsv(params);
  
  // Download CSV
  const BOM = '\ufeff';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `percurso_premium_${deviceId}_${startDate}_${endDate}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  endMeasure('exportExcelPremium', { points: filteredRoutePoints.value.length });
  ElMessage.success(safeT('device.ExportOK', 'Arquivo exportado com sucesso'));
};

/**
 * Gera e copia link de compartilhamento
 */
const copyShareLink = async () => {
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  
  // Coletar índices dos bookmarks
  const bookmarkIndexes = bookmarks.value.map(b => b.index);
  
  const params = {
    deviceId,
    dateRange: formData.value.date,
    filters: {
      searchQuery: searchQuery.value,
      eventFilter: eventFilter.value,
      customSpeed: customSpeed.value,
      removeDuplicates: removeDuplicates.value
    },
    routeColor: currentRouteColor.value,
    playbackSpeed: playbackSpeed.value,
    followPlay: followPlay.value,
    seekIndex: currentPlayingPoint.value > 0 ? currentPlayingPoint.value : null,
    bookmarkIndexes
  };
  
  // Gerar URL
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = generateShareUrl(baseUrl, params);
  
  if (!shareUrl) {
    ElMessage.error(safeT('report.shareError', 'Erro ao gerar link'));
    return;
  }
  
  // Copiar para clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success(safeT('report.shareLinkCopied', 'Link copiado para a área de transferência!'));
  } catch (err) {
    // Fallback para navegadores antigos
    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success(safeT('report.shareLinkCopied', 'Link copiado para a área de transferência!'));
  }
};

/**
 * FASE 13: Export KML (Google Earth)
 */
const exportKml = () => {
  if (filteredRoutePoints.value.length === 0) {
    ElMessage.warning(safeT('route.empty', 'Sem pontos para exportar'));
    return;
  }
  if (!validateForm()) return;
  
  const deviceId = formData.value.deviceId;
  const deviceName = getDeviceName(deviceId);
  const startDate = formData.value.date[0];
  const endDate = formData.value.date[1];
  
  // Gerar KML
  const kml = generateKml(filteredRoutePoints.value, deviceName, startDate, endDate);
  
  if (!kml) {
    ElMessage.error(safeT('report.exportError', 'Erro ao gerar arquivo'));
    return;
  }
  
  // Download
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `${deviceName}_route_${formatDateForFilename(startDate)}.kml`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success(safeT('device.ExportOK', 'Arquivo exportado com sucesso'));
};

/**
 * Restaura estado a partir de share param na URL
 */
const restoreFromShareLink = () => {
  const shareParam = route.query.share;
  if (!shareParam) return false;
  
  const payload = parseSharePayload(shareParam);
  if (!payload) {
    debugLog('Share payload inválido');
    return false;
  }
  
  debugLog('Restaurando de share link:', payload);
  
  // Aplicar estado
  if (payload.deviceId) {
    formData.value.deviceId = payload.deviceId;
  }
  
  if (payload.dateRange?.[0] && payload.dateRange?.[1]) {
    formData.value.date = payload.dateRange;
  }
  
  if (payload.filters) {
    if (payload.filters.searchQuery) searchQuery.value = payload.filters.searchQuery;
    if (payload.filters.eventFilter) eventFilter.value = payload.filters.eventFilter;
    if (payload.filters.customSpeed) customSpeed.value = payload.filters.customSpeed;
    if (payload.filters.removeDuplicates !== undefined) removeDuplicates.value = payload.filters.removeDuplicates;
  }
  
  if (payload.routeColor) currentRouteColor.value = payload.routeColor;
  if (payload.playbackSpeed) playbackSpeed.value = payload.playbackSpeed;
  if (payload.followPlay !== undefined) followPlay.value = payload.followPlay;
  
  // Limpar share param da URL
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
  
  // Retornar info para carregar rota automaticamente
  return {
    shouldLoad: true,
    seekIndex: payload.seekIndex,
    bookmarkIndexes: payload.bookmarkIndexes
  };
};

// ============================================
// CÁLCULOS DE ESTATÍSTICAS
// ============================================

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalDistance = () => {
  if (routePoints.value.length === 0) return '0.00';
  let total = 0;
  for (let i = 1; i < routePoints.value.length; i++) {
    const p1 = routePoints.value[i - 1];
    const p2 = routePoints.value[i];
    total += getDistanceFromLatLonInKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }
  return total.toFixed(2);
};

const calculateAvgSpeed = () => {
  if (routePoints.value.length === 0) return '0.00';
  const totalSpeed = routePoints.value.reduce((sum, p) => sum + (p.speed || 0), 0);
  return (totalSpeed / routePoints.value.length).toFixed(2);
};

const calculateDuration = () => {
  if (routePoints.value.length < 2) return '0h 0m';
  const startTime = new Date(routePoints.value[0].fixTime).getTime();
  const endTime = new Date(routePoints.value[routePoints.value.length - 1].fixTime).getTime();
  const durationMs = endTime - startTime;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const calculateStopTime = () => {
  if (routePoints.value.length < 2) return '0h 0m';
  let stopTimeMs = 0;
  let isCurrentlyStopped = false;
  let stopStartTime = null;
  
  for (let i = 0; i < routePoints.value.length; i++) {
    const p = routePoints.value[i];
    if (p.speed < 1) {
      if (!isCurrentlyStopped) {
        isCurrentlyStopped = true;
        stopStartTime = new Date(p.fixTime).getTime();
      }
    } else {
      if (isCurrentlyStopped && stopStartTime !== null) {
        stopTimeMs += (new Date(p.fixTime).getTime() - stopStartTime);
        isCurrentlyStopped = false;
        stopStartTime = null;
      }
    }
  }
  
  if (isCurrentlyStopped && stopStartTime !== null) {
    const lastPoint = routePoints.value[routePoints.value.length - 1];
    stopTimeMs += (new Date(lastPoint.fixTime).getTime() - stopStartTime);
  }
  
  const hours = Math.floor(stopTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((stopTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// ============================================
// WATCHERS
// ============================================

// Sync formData com store
watch(formData, () => {
  // HARDENING RISCO 4: Evitar loop de update durante loading
  if (isLoading.value) return;
  
  const { deviceId, date } = formData.value;
  if (!deviceId || !date?.[0] || !date?.[1]) return;
  sendDataToStore();
}, { deep: true });

// Debounce para filtros
watch([searchQuery, eventFilter, customSpeed, removeDuplicates], () => {
  if (routePoints.value.length > 0) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateMapRoute();
    }, DEBOUNCE_DELAY);
  }
});

// Heatmap toggle
watch(showHeatmap, (enabled) => {
  debugLog('Heatmap toggle:', enabled);
  toggleHeatmap?.(enabled);
  store.commit('devices/setShowCalor', enabled);
});

// 5️⃣ Scroll automático APENAS quando estiver em modo play
watch(currentPlayingPoint, (newValue) => {
  // DEBUG: Log para verificar se o watcher está funcionando
  if (process.env.NODE_ENV === 'development') {
    debugLog(`[PLAY SYNC] currentPlayingPoint mudou para ${newValue}, isPlaying=${isPlayingRoute.value}`);
  }
  
  // Só faz scroll se estiver reproduzindo e tiver pontos
  if (!isPlayingRoute.value) return;
  if (newValue > 0 && filteredRoutePoints.value.length > 0) {
    // Validar se o índice existe no array filtrado
    if (newValue >= filteredRoutePoints.value.length) {
      debugLog(`[PLAY SYNC] ⚠️ Índice ${newValue} fora do range (max: ${filteredRoutePoints.value.length - 1})`);
      return;
    }
    nextTick(() => scrollToActivePoint(newValue));
  }
});

// Carregar rota via query param (ex: ?deviceId=123)
// PATCH 2: Centralizado aqui - evita duplicação com onMounted
watch(() => formData.value.deviceId, (newVal) => {
  // Só carregar se tiver deviceId válido
  // HARDENING RISCO 5: Guard isLoading para garantir single-flight
  if (newVal && typeof newVal === 'number' && newVal > 0 && !isLoading.value) {
    loadRoute();
  }
});

// PATCH 4: Recalcular containerHeight quando a timeline aparece
watch(
  () => filteredRoutePoints.value.length,
  async (len) => {
    await nextTick();
    if (len > 2 && timelineScrollRef.value) {
      containerHeight.value = timelineScrollRef.value.clientHeight || 400;
      measureItemHeight();
    }
  }
);

// ============================================
// FASE 13.2: MEDIÇÃO DINÂMICA DE ALTURA
// ============================================
/**
 * Mede a altura real do primeiro item da timeline e atualiza virtualItemHeight.
 * Chamado em onMounted e após loadRoute para garantir precisão do scroll virtual.
 */
const measureItemHeight = () => {
  nextTick(() => {
    // HARDENING RISCO 6: Isolar escopo para evitar medir elemento de outra timeline
    const root = timelineScrollRef.value;
    if (!root) {
      debugLog('[FASE 13.2] timelineScrollRef não disponível para medição');
      return;
    }
    
    // PATCH 6: Priorizar item 'middle' que tem layout mais representativo
    const targetItem = root.querySelector('.timeline-point.type-middle') 
                    || root.querySelector('.timeline-point');
    if (targetItem) {
      const rect = targetItem.getBoundingClientRect();
      const measuredHeight = rect.height;
      
      // Validação: altura deve ser razoável (entre 40px e 200px)
      if (measuredHeight > 40 && measuredHeight < 200) {
        virtualItemHeight.value = measuredHeight;
        debugLog(`[FASE 13.2] Altura medida: ${measuredHeight.toFixed(2)}px`);
      } else {
        debugLog(`[FASE 13.2] Altura inválida ignorada: ${measuredHeight}px`);
      }
    } else {
      debugLog('[FASE 13.2] .timeline-point não encontrado para medição');
    }
  });
};

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  // Medir altura real do container para virtualização correta
  if (timelineScrollRef.value) {
    containerHeight.value = timelineScrollRef.value.clientHeight || 400;
  }
  
  // FASE 13.2: Medir altura real dos itens (primeira medição)
  measureItemHeight();
  
  // FASE 9: Verificar share link na URL
  const shareResult = restoreFromShareLink();
  
  if (shareResult?.shouldLoad) {
    // Share link detectado - carregar rota automaticamente
    // HARDENING RISCO 5: Guard isLoading para garantir single-flight
    nextTick(() => {
      if (!isLoading.value) {
        loadRoute().then(() => {
          // Após carregar, aplicar seek se especificado
          if (shareResult.seekIndex !== null && shareResult.seekIndex >= 0) {
            setTimeout(() => {
              onSeekToPoint(shareResult.seekIndex);
            }, 500);
          }
        });
      }
    });
  } else if (route.query.deviceId) {
    // PATCH 2: Apenas setar deviceId - o watch abaixo irá chamar loadRoute()
    formData.value.deviceId = parseInt(route.query.deviceId);
  }
});

onBeforeUnmount(() => {
  // Limpar debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  // PR#4: Limpar todos overlays do mapa ao desmontar componente
  // PATCH 5: scope 'history' para não apagar overlays de outras features
  if (clearAllOverlays) {
    clearAllOverlays({ reason: 'component-unmount', scope: 'history' });
  }
  
  // useRequestControl já cuida do abort automático
  // Resetar estados do store
  store.dispatch('devices/resetDeviceStates');
});

// PR#4: Limpar overlays ao navegar para outra rota
// PATCH 5: scope 'history' para não apagar overlays de outras features
onBeforeRouteLeave(() => {
  if (clearAllOverlays) {
    clearAllOverlays({ reason: 'route-leave', scope: 'history' });
  }
});
</script>

<style scoped>
.el-select.el-select--large {
  width: 100%;
}

/* Timeline Container */
.timeline-container {
  display: flex;
  flex-direction: column;
  border: var(--el-border-color-light) 1px solid;
  margin-top: 20px;
  border-radius: 10px;
  background: var(--el-bg-color);
}

.timeline-message {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* FASE 13.6.2: Scroll suave com CSS scroll-behavior */
.timeline-scroll {
  overflow: auto;
  max-height: clamp(260px, 40vh, 420px);
  position: relative;
  scroll-behavior: smooth; /* Easing natural do browser (ease-out perceptivo) */
}

/* FASE 13.6.4: Respeitar reduced motion (A11y) */
@media (prefers-reduced-motion: reduce) {
  .timeline-scroll {
    scroll-behavior: auto; /* Instant scroll para usuários com preferência de redução de movimento */
  }
}

/* Stats Card */
.stats-card,
.stats-card * {
  max-width: 100%;
  text-size-adjust: 100%;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-title {
  font-weight: bold;
  font-size: 14px;
}

.driver-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.driver-pill i {
  color: var(--el-color-primary);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-box {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow) !important;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: clamp(20px, 2vw, 24px);
  flex-shrink: 0;
}

.stat-icon-primary { color: var(--el-color-primary); }
.stat-icon-success { color: var(--el-color-success); }
.stat-icon-warning { color: var(--el-color-warning); }
.stat-icon-danger { color: var(--el-color-danger); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  opacity: 0.85;
  margin-bottom: 4px;
}

.stat-value {
  font-size: clamp(16px, 1.6vw, 20px);
  line-height: 1.1;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

/* Form e Actions */
.history-card {
  margin-bottom: 16px;
}

.history-form {
  padding: 16px 28px 0;
}

.view-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  align-items: center;
  padding: 10px 0;
}

.view-options-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  margin-right: 8px;
}

.view-options-label i {
  margin-right: 4px;
}

.route-color-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.route-color-selector .color-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.history-actions {
  position: sticky;
  bottom: 0;
  background: var(--el-bg-color);
  padding: 12px 0;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.stats-card {
  margin-top: 16px;
}

/* ============================================================================
   FASE 12: ESTADOS VAZIOS E DISCLAIMER DE STATS
   ============================================================================ */

.stats-disclaimer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-disclaimer i {
  color: var(--el-color-info);
}

.empty-state-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.timeline-filters {
  border: var(--el-border-color-lighter) 1px solid;
}

/* ============================================================================
   FASE 11: INSIGHTS AVANÇADOS (Premium Mode)
   ============================================================================ */

.premium-insights-card {
  border: 2px solid var(--el-color-warning-light-5);
  background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-bg-color) 100%);
}

.insights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: bold;
}

.insights-header > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}

.insights-header i {
  color: var(--el-color-warning);
}

.insights-tabs {
  margin: -12px;
}

.insights-tabs :deep(.el-tabs__content) {
  padding: 16px;
}

.insights-tabs :deep(.el-tabs__header) {
  background: var(--el-fill-color-lighter);
}

.insights-tabs :deep(.el-tabs__item) {
  font-size: 13px;
}

.insights-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-warning);
}

/* ============================================================================
   FASE 8: RESUMO EXECUTIVO
   ============================================================================ */

.executive-summary-card {
  border: var(--el-border-color-lighter) 1px solid;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  transition: all 0.15s ease;
}

.summary-item-clickable {
  cursor: pointer;
}

.summary-item-clickable:hover {
  background: var(--el-fill-color-light);
  transform: translateX(2px);
}

.summary-item-highlight {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
}

.summary-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  color: var(--icon-color, var(--el-color-primary));
  font-size: 16px;
  flex-shrink: 0;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.summary-address {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.summary-action {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  align-self: center;
}

.summary-percent {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.percent-bar {
  flex: 1;
  height: 4px;
  background: var(--el-fill-color);
  border-radius: 2px;
  overflow: hidden;
}

.percent-fill {
  height: 100%;
  background: var(--el-color-success);
  transition: width 0.3s ease;
}

/* ============================================================================
   FASE 8: CAPÍTULOS DA VIAGEM
   ============================================================================ */

.chapters-card {
  border: var(--el-border-color-lighter) 1px solid;
}

.chapters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
}

.chapters-count {
  font-weight: normal;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 10px;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chapter-item:hover {
  background: var(--el-fill-color-light);
  transform: translateX(2px);
}

.chapter-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  color: white;
  font-weight: 600;
  font-size: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chapter-content {
  flex: 1;
  min-width: 0;
}

.chapter-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.chapter-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.chapter-details i {
  margin-right: 2px;
}

.chapter-addresses {
  display: flex;
  flex-direction: column;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.chapter-start::before {
  content: '▶ ';
  color: var(--el-color-success);
}

.chapter-end::before {
  content: '⏹ ';
  color: var(--el-color-danger);
}

.chapter-action {
  color: var(--el-color-primary);
  font-size: 18px;
  flex-shrink: 0;
}

/* ============================================================================
   FASE 8: BOOKMARKS (FAVORITOS)
   ============================================================================ */

.bookmarks-card {
  border: var(--el-border-color-lighter) 1px solid;
}

.bookmarks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
}

.bookmarks-count {
  font-weight: normal;
  font-size: 12px;
  color: white;
  background: var(--el-color-warning);
  padding: 2px 8px;
  border-radius: 10px;
}

.bookmarks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--el-color-warning-light-9);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bookmark-item:hover {
  background: var(--el-color-warning-light-8);
  transform: translateX(2px);
}

.bookmark-icon {
  color: var(--el-color-warning);
  font-size: 14px;
}

.bookmark-content {
  flex: 1;
  min-width: 0;
}

.bookmark-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.bookmark-address {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-action {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

/* Animations */
.stats-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .timeline-scroll {
    max-height: 320px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
