/**
 * routeStressMode.js
 * 
 * FASE 10 — Modo Stress para testes de carga
 * 
 * Permite simular 1k / 5k / 10k / 20k pontos sem backend.
 * Gera dados realistas para testar todo o pipeline.
 * 
 * ⚠️ REGRAS:
 * - Apenas DEV
 * - Não salva nada
 * - Dados são descartados ao recarregar
 * - Mock respeita estrutura real dos dados
 */

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const IS_DEV = process.env.NODE_ENV === 'development';

// Coordenadas base (São Paulo, Brasil)
const BASE_LAT = -23.5505;
const BASE_LNG = -46.6333;

// Velocidades típicas (km/h) - usadas em generateSpeed
// eslint-disable-next-line no-unused-vars
const SPEEDS = { STOPPED: 0, CITY: 40, HIGHWAY: 100, MAX: 140 };

// ============================================================================
// GERAÇÃO DE DADOS
// ============================================================================

/**
 * Gera número aleatório em range
 */
const randomInRange = (min, max) => Math.random() * (max - min) + min;

/**
 * Gera curso (direção) realista
 */
const generateCourse = (prevCourse = 0) => {
  // Mudança suave de direção (-30 a +30 graus)
  const change = randomInRange(-30, 30);
  let course = prevCourse + change;
  if (course < 0) course += 360;
  if (course >= 360) course -= 360;
  return Math.round(course);
};

/**
 * Gera velocidade realista baseada em padrões
 */
const generateSpeed = (pattern = 'city') => {
  switch (pattern) {
    case 'stopped':
      return 0;
    case 'city':
      return Math.round(randomInRange(20, 60));
    case 'highway':
      return Math.round(randomInRange(80, 120));
    case 'speeding':
      return Math.round(randomInRange(100, 150));
    default:
      return Math.round(randomInRange(0, 80));
  }
};

/**
 * Gera endereço fake
 */
const generateAddress = (index) => {
  const streets = [
    'Av. Paulista', 'R. Augusta', 'Av. Faria Lima', 'R. Oscar Freire',
    'Av. Rebouças', 'R. Haddock Lobo', 'Av. Brasil', 'R. da Consolação',
    'Av. Brigadeiro', 'R. Bela Cintra', 'Av. 9 de Julho', 'R. Alameda Santos'
  ];
  const street = streets[index % streets.length];
  const number = Math.floor(randomInRange(100, 3000));
  return `${street}, ${number} - São Paulo, SP`;
};

/**
 * Gera um único ponto de rota
 * @param {number} index - Índice do ponto
 * @param {Object} prevPoint - Ponto anterior (para continuidade)
 * @param {Object} config - Configuração
 * @returns {Object}
 */
const generatePoint = (index, prevPoint, config = {}) => {
  const {
    baseTime = Date.now() - 3600000, // 1h atrás
    intervalMs = 10000, // 10 segundos entre pontos
    deviceId = 999,
    eventChance = 0.05 // 5% chance de evento
  } = config;
  
  // Calcular posição
  let lat, lng, course, speed;
  
  if (prevPoint) {
    // Movimento contínuo
    course = generateCourse(prevPoint.course);
    
    // Decidir padrão de velocidade
    let pattern = 'city';
    if (Math.random() < 0.1) pattern = 'stopped'; // 10% parado
    if (Math.random() < 0.2) pattern = 'highway'; // 20% rodovia
    if (Math.random() < eventChance) pattern = 'speeding'; // evento de velocidade
    
    speed = generateSpeed(pattern);
    
    // Mover baseado na velocidade e curso
    const distance = (speed / 3600) * (intervalMs / 1000); // km
    const latChange = distance * Math.cos(course * Math.PI / 180) / 111;
    const lngChange = distance * Math.sin(course * Math.PI / 180) / 111;
    
    lat = prevPoint.latitude + latChange;
    lng = prevPoint.longitude + lngChange;
  } else {
    // Primeiro ponto
    lat = BASE_LAT + randomInRange(-0.01, 0.01);
    lng = BASE_LNG + randomInRange(-0.01, 0.01);
    course = generateCourse();
    speed = generateSpeed('city');
  }
  
  // Ignição (95% ligada quando em movimento)
  const ignition = speed > 0 ? (Math.random() < 0.95) : (Math.random() < 0.3);
  
  return {
    id: index + 1,
    deviceId,
    latitude: Math.round(lat * 1000000) / 1000000,
    longitude: Math.round(lng * 1000000) / 1000000,
    course: Math.round(course),
    speed: Math.round(speed * 100) / 100,
    fixTime: new Date(baseTime + (index * intervalMs)).toISOString(),
    address: generateAddress(index),
    attributes: {
      ignition,
      batteryLevel: Math.round(randomInRange(70, 100)),
      satellites: Math.floor(randomInRange(8, 15))
    },
    valid: true
  };
};

/**
 * Gera conjunto de pontos para teste
 * @param {number} count - Quantidade de pontos
 * @param {Object} options - Opções
 * @returns {Array}
 */
export const generateMockPoints = (count = 1000, options = {}) => {
  const {
    deviceId = 999,
    startTime = Date.now() - (count * 10000), // Cada ponto 10s
    intervalMs = 10000,
    eventChance = 0.05,
    includeStops = true,
    stopCount = Math.floor(count / 200) // 1 parada a cada 200 pontos
  } = options;
  
  console.log(`[StressMode] Generating ${count} mock points...`);
  const startGen = performance.now();
  
  const points = [];
  let prevPoint = null;
  
  // Calcular posições de paradas
  const stopPositions = [];
  if (includeStops && stopCount > 0) {
    const interval = Math.floor(count / stopCount);
    for (let i = 1; i <= stopCount; i++) {
      stopPositions.push(interval * i + Math.floor(randomInRange(-10, 10)));
    }
  }
  
  for (let i = 0; i < count; i++) {
    // Verificar se é parada
    const isStop = stopPositions.includes(i);
    const stopDuration = isStop ? Math.floor(randomInRange(5, 30)) : 0;
    
    if (isStop) {
      // Gerar pontos de parada
      for (let j = 0; j < stopDuration && (i + j) < count; j++) {
        const stopPoint = generatePoint(i + j, prevPoint, {
          baseTime: startTime,
          intervalMs,
          deviceId,
          eventChance: 0
        });
        stopPoint.speed = 0;
        stopPoint.attributes.ignition = false;
        points.push(stopPoint);
        prevPoint = stopPoint;
      }
      i += stopDuration - 1;
    } else {
      const point = generatePoint(i, prevPoint, {
        baseTime: startTime,
        intervalMs,
        deviceId,
        eventChance
      });
      points.push(point);
      prevPoint = point;
    }
  }
  
  const elapsed = performance.now() - startGen;
  console.log(`[StressMode] Generated ${points.length} points in ${elapsed.toFixed(2)}ms`);
  
  return points;
};

/**
 * Presets de teste
 */
export const STRESS_PRESETS = {
  SMALL: { count: 1000, label: '1K pontos (teste rápido)' },
  MEDIUM: { count: 5000, label: '5K pontos (uso normal)' },
  LARGE: { count: 10000, label: '10K pontos (stress)' },
  EXTREME: { count: 20000, label: '20K pontos (limite)' }
};

/**
 * Ativa modo stress e retorna pontos mock
 * @param {'SMALL'|'MEDIUM'|'LARGE'|'EXTREME'|number} preset - Preset ou número
 * @param {Object} options - Opções adicionais
 * @returns {Object} - { points, config }
 */
export const activateStressMode = (preset = 'MEDIUM', options = {}) => {
  if (!IS_DEV) {
    console.warn('[StressMode] Only available in development mode');
    return null;
  }
  
  const count = typeof preset === 'number' 
    ? preset 
    : (STRESS_PRESETS[preset]?.count || 5000);
  
  const config = {
    count,
    preset: typeof preset === 'string' ? preset : 'CUSTOM',
    startTime: Date.now(),
    ...options
  };
  
  const points = generateMockPoints(count, options);
  
  // Marcar no window
  window.ROUTE_STRESS_MODE = true;
  window.__stressModeData = {
    points,
    config,
    activatedAt: new Date().toISOString()
  };
  
  console.log(`[StressMode] ✅ Activated with ${count} points`);
  console.log('[StressMode] Use window.__stressModeData.points to access mock data');
  
  return { points, config };
};

/**
 * Desativa modo stress
 */
export const deactivateStressMode = () => {
  window.ROUTE_STRESS_MODE = false;
  window.__stressModeData = null;
  console.log('[StressMode] ❌ Deactivated');
};

/**
 * Verifica se modo stress está ativo
 * @returns {boolean}
 */
export const isStressModeActive = () => {
  return typeof window !== 'undefined' && window.ROUTE_STRESS_MODE === true;
};

/**
 * Obtém pontos do stress mode (se ativo)
 * @returns {Array|null}
 */
export const getStressModePoints = () => {
  if (!isStressModeActive()) return null;
  return window.__stressModeData?.points || null;
};

// ============================================================================
// HELPERS DE CONSOLE (DEV)
// ============================================================================

if (typeof window !== 'undefined' && IS_DEV) {
  window.routeStress = {
    activate: activateStressMode,
    deactivate: deactivateStressMode,
    isActive: isStressModeActive,
    getPoints: getStressModePoints,
    presets: STRESS_PRESETS,
    generate: generateMockPoints
  };
  
  console.log('🔥 Route Stress Mode available: window.routeStress.activate("MEDIUM")');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateMockPoints,
  activateStressMode,
  deactivateStressMode,
  isStressModeActive,
  getStressModePoints,
  STRESS_PRESETS
};
