/**
 * mapUtils.ts
 * Funções puras para operações de mapa (sem side effects)
 * Extraído de kore-map.vue na FASE B1 (refatoração segura)
 * 
 * Regras:
 * - Apenas funções puras (input → output)
 * - Sem acesso a Leaflet, DOM, store, refs ou this
 * - 100% testável isoladamente
 */

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado ou string original se inválido
 */
export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

/**
 * Normaliza course (direção) para valor válido 0-360
 * Trata null, undefined, NaN e valores fora do range
 * @param {number} course - Valor de course (pode ser inválido)
 * @returns {number} Course normalizado entre 0 e 360
 */
export const normalizeCourse = (course: number | null | undefined): number => {
  // Tratar valores inválidos
  if (course == null || typeof course !== 'number' || isNaN(course)) {
    return 0;
  }
  // Normalizar para 0-360 (funciona com negativos e > 360)
  return ((course % 360) + 360) % 360;
};

/**
 * Retorna a direção cardinal baseada no curso
 * @param {number} course - Course em graus (0-360)
 * @returns {string} Direção cardinal (N, NE, E, SE, S, SW, W, NW)
 */
export const getCardinalDirection = (course: number | null | undefined): string => {
  if (course === null || course === undefined) return 'N/A';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(course / 45) % 8;
  return directions[index];
};

/**
 * Formata data/hora no padrão brasileiro
 * @param {string} dateString - String de data ISO ou timestamp
 * @returns {string} Data formatada DD/MM/YYYY HH:MM:SS ou 'N/A'
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * Retorna o ícone Font Awesome de bateria baseado no nível
 * @param {number} level - Nível de bateria (0-100%)
 * @returns {string} Classe do ícone Font Awesome
 */
export const getBatteryIcon = (level: number | null | undefined): string => {
  if (level === undefined || level === null) return 'fas fa-battery-empty';

  if (level >= 90) return 'fas fa-battery-full';
  if (level >= 70) return 'fas fa-battery-three-quarters';
  if (level >= 40) return 'fas fa-battery-half';
  if (level >= 10) return 'fas fa-battery-quarter';
  return 'fas fa-battery-empty';
};

/**
 * Retorna a classe CSS de cor baseada no nível de bateria
 * @param {number} level - Nível de bateria (0-100%)
 * @returns {string} Classe CSS (danger, warning, active)
 */
export const getBatteryClass = (level: number | null | undefined): string => {
  if (level === undefined || level === null) return '';

  if (level < 30) return 'danger';
  if (level < 70) return 'warning';
  return 'active';
};

/**
 * Retorna a classe CSS baseada na temperatura
 * @param {number} temp - Temperatura em Celsius
 * @returns {string} Classe CSS (danger, warning, info, active)
 */
export const getTemperatureClass = (temp: number | null | undefined): string => {
  if (temp === undefined || temp === null) return '';

  if (temp > 80) return 'danger';
  if (temp > 60) return 'warning';
  if (temp < 0) return 'info';
  return 'active';
};

/**
 * Retorna a classe CSS baseada no sinal RSSI
 * @param {number} rssi - RSSI (valores negativos, próximo de 0 é melhor)
 * @returns {string} Classe CSS (danger, warning, active)
 */
export const getSignalClass = (rssi: number | null | undefined): string => {
  if (rssi === undefined || rssi === null) return '';

  // RSSI geralmente é negativo, valores mais próximos de 0 são melhores
  if (rssi > -70) return 'active';
  if (rssi > -85) return 'warning';
  return 'danger';
};

/**
 * Formata o valor de um atributo de forma inteligente
 * @param {string} key - Chave do atributo
 * @param {any} value - Valor a formatar
 * @returns {string} Valor formatado
 */
export const formatAttributeValue = (key: string, value: any): string => {
  if (value === undefined || value === null) return '-';

  // Distâncias (converter metros para km)
  if (key.toLowerCase().includes('distance') || key.toLowerCase().includes('odometer')) {
    if (typeof value === 'number') {
      return (value / 1000).toFixed(2) + ' km';
    }
  }

  // Temperaturas
  if (key.toLowerCase().includes('temp')) {
    if (typeof value === 'number') {
      return value.toFixed(1) + ' °C';
    }
  }

  // Velocidades
  if (key.toLowerCase().includes('speed')) {
    if (typeof value === 'number') {
      return Math.round(value * 1.852) + ' km/h';
    }
  }

  // Porcentagens
  if (key.toLowerCase().includes('level') || key.toLowerCase().includes('percent')) {
    if (typeof value === 'number') {
      return Math.round(value) + '%';
    }
  }

  // Datas
  if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
};
