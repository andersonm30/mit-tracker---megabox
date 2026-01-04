/**
 * TT - Função de tradução com valores interpolados
 * Similar ao KT mas com suporte a formatação de valores
 */
import i18n from "../../lang/";

export default function(key, data) {
  const translation = i18n.global.t(key);
  
  if (translation && translation !== key) {
    let result = translation;
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        // Suporta tanto %key% quanto {key}
        result = result.replace(new RegExp(`%${k}%`, 'g'), v);
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return result;
  } else {
    // Se não encontrar tradução, retorna o valor formatado
    if (data && data.value !== undefined) {
      return data.value;
    }
    return key;
  }
}
