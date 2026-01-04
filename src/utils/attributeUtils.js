/**
 * @file attributeUtils.js
 * @description Funções puras para manipulação de atributos de posição - sem dependências de DOM, store ou window
 */

/**
 * Obtém valor aninhado de um objeto usando path com pontos
 * @param {Object} obj - Objeto fonte
 * @param {string} path - Caminho com pontos (ex: "attributes.speed")
 * @returns {*} Valor encontrado ou null
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path || typeof path !== 'string') return null;
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Busca um atributo em um objeto position, tentando múltiplos caminhos
 * 
 * Ordem de busca:
 * 1. position.attributes[a] - acesso direto
 * 2. position.attributes nested path - caminho aninhado em attributes
 * 3. position[a] - acesso direto em position
 * 4. position nested path - caminho aninhado em position
 * 
 * @param {Object} position - Objeto de posição do dispositivo
 * @param {string} attributePath - Caminho do atributo (ex: "speed", "attributes.fuel")
 * @returns {*} Valor do atributo ou null se não encontrado
 */
export const findAttribute = (position, attributePath) => {
  if (!position || !attributePath) return null;
  
  // 1. Tenta em position.attributes diretamente
  let result = position.attributes?.[attributePath];
  
  // 2. Se não encontrar, tenta caminho aninhado em attributes
  if (result === undefined || result === null) {
    result = getNestedValue(position.attributes, attributePath);
  }
  
  // 3. Se ainda não encontrar, tenta diretamente em position
  if (result === undefined || result === null) {
    result = position[attributePath];
  }
  
  // 4. Por fim, tenta caminho aninhado em position
  if (result === undefined || result === null) {
    result = getNestedValue(position, attributePath);
  }

  return result;
};

/**
 * Verifica se um atributo existe em um objeto position
 * @param {Object} position - Objeto de posição
 * @param {string} attributePath - Caminho do atributo
 * @returns {boolean} True se o atributo existe e não é null/undefined
 */
export const hasAttribute = (position, attributePath) => {
  const value = findAttribute(position, attributePath);
  return value !== null && value !== undefined;
};

/**
 * Obtém múltiplos atributos de uma vez
 * @param {Object} position - Objeto de posição
 * @param {string[]} attributePaths - Array de caminhos de atributos
 * @returns {Object} Objeto com { path: value } para cada atributo encontrado
 */
export const findAttributes = (position, attributePaths) => {
  if (!position || !Array.isArray(attributePaths)) return {};
  
  const result = {};
  for (const path of attributePaths) {
    const value = findAttribute(position, path);
    if (value !== null && value !== undefined) {
      result[path] = value;
    }
  }
  return result;
};

/**
 * Extrai todos os atributos "flat" de um objeto position.attributes
 * @param {Object} position - Objeto de posição
 * @returns {Array<{name: string, value: *}>} Array de atributos
 */
export const extractFlatAttributes = (position) => {
  if (!position?.attributes) return [];
  
  const result = [];
  for (const [key, value] of Object.entries(position.attributes)) {
    if (value !== null && value !== undefined) {
      result.push({ name: key, value });
    }
  }
  return result;
};
