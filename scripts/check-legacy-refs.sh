#!/bin/bash

# TRAVA C: Grep obrigatório no pipeline CI/CD
# Bloqueia merge se encontrar window.$traccar ou window.$tarkan

echo "🔍 Verificando refs legadas (window.\$traccar / window.\$tarkan)..."

TRACCAR_REFS=$(grep -R "window\.\$traccar" src/ --include="*.js" --include="*.vue" \
  --exclude="*runtimeApi.js" --exclude="*traccarConnector.js" --exclude="*.backup.*" | wc -l)

TARKAN_REFS=$(grep -R "window\.\$tarkan" src/ --include="*.js" --include="*.vue" \
  --exclude="*runtimeApi.js" --exclude="*tarkanConnector.js" --exclude="*.backup.*" | wc -l)

TOTAL=$((TRACCAR_REFS + TARKAN_REFS))

if [ $TOTAL -gt 0 ]; then
  echo "❌ FALHOU: $TOTAL refs legadas encontradas!"
  echo ""
  echo "   window.\$traccar: $TRACCAR_REFS refs"
  echo "   window.\$tarkan:  $TARKAN_REFS refs"
  echo ""
  echo "   Use runtimeApi (inject/getRuntimeApi) ao invés de window.\$traccar/\$tarkan."
  echo "   Veja: src/services/runtimeApi.js"
  exit 1
else
  echo "✅ PASSOU: 0 refs legadas encontradas."
  exit 0
fi
