// src/composables/useModalA11yLock.js
/**
 * useModalA11yLock - Composable para gerenciamento de modais com acessibilidade e scroll lock
 * 
 * ⚠️  INVARIANTES CRÍTICOS - DO NOT TOUCH WITHOUT UNDERSTANDING:
 * 
 * 1. FONTE ÚNICA DE FOCO/RESTORE
 *    - Apenas este composable controla foco inicial e restauração
 *    - Componentes modais NÃO devem chamar .focus() diretamente
 *    - Motivo: previne "focus bounce" em iOS/Safari (foco pula entre elementos)
 * 
 * 2. SCROLL LOCK COM position:fixed + top:-y
 *    - iOS Safari não respeita overflow:hidden no body
 *    - Solução: position:fixed + top negativo = scroll "congelado"
 *    - getScrollY() usa ?? ao invés de || para evitar edge case com scrollY=0
 *    - prevBodyStyles é a flag de "isLocked" (idempotência)
 * 
 * 3. VISIBILITY CHANGE RELOCK
 *    - iOS pode "soltar" scroll quando app vai/volta do background
 *    - Ao voltar (visible): reaplica lock + invalida cache de focusables
 *    - Motivo: DOM pode ter mudado durante background
 * 
 * 4. isVisible() COM getClientRects
 *    - offsetParent === null também retorna null para position:fixed (armadilha!)
 *    - getClientRects().length > 0 é mais confiável (padrão focus-trap/floating-ui)
 *    - Filtra display:none, visibility:hidden, aria-hidden, disabled
 * 
 * 5. HMR IDEMPOTENCY
 *    - Listeners removidos no watch(false) E no onBeforeUnmount
 *    - prevBodyStyles usado como guard contra double-lock
 *    - Motivo: hot reload pode chamar mount sem unmount em dev
 * 
 * 6. SAFARI < 15.5 INERT FALLBACK
 *    - Navegadores sem suporte a inert usam .is-inert class
 *    - CSS correspondente deve ter pointer-events:none + user-select:none
 * 
 * PERFORMANCE:
 * - Cache de focusables (invalidado apenas quando DOM muda)
 * - rAF para restauração de foco (evita layout thrashing)
 * - Guard de double-lock (previne relockar em visibilitychange múltiplos)
 * 
 * TESTES OBRIGATÓRIOS ANTES DE MODIFICAR:
 * - Mobile Safari: scroll lock durante modal aberto
 * - TAB trap: não escapa do modal, foca apenas elementos visíveis
 * - ESC fecha modal + restaura foco
 * - Menu mobile + modal: menu fecha antes de lock
 * - Minimizar app → voltar: scroll continua locked
 */
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

export function useModalA11yLock(options) {
  const {
    modalOpen,
    isMenuOverlayOpen,
    menuShown,
    portrait,
    emitInvalidate,
    onEscapeClose,
    customDialogSelector = '.modal-overlay[role="dialog"][aria-modal="true"]',
  } = options

  const previouslyFocusedEl = ref(null)
  const prevBodyStyles = ref(null)

  let cachedDialog = null
  let cachedFocusables = []
  const invalidateFocusCache = () => {
    cachedDialog = null
    cachedFocusables = []
  }

  // ✅ ScrollY robusto (inclui body.scrollTop)
  const getScrollY = () => {
    return (
      window.scrollY ??
      document.documentElement.scrollTop ??
      document.body.scrollTop ??
      0
    )
  }

  const findDialog = () => {
    return (
      document.querySelector(customDialogSelector) ||
      document.querySelector('.el-dialog[role="dialog"]') ||
      document.querySelector('.el-dialog')
    )
  }

  const lockBodyScroll = () => {
    // ✅ Guard contra double-lock (iOS visibilitychange pode disparar visible múltiplas vezes)
    // Se já estamos locked, não relocka para preservar scrollY original
    if (prevBodyStyles.value) return

    const y = getScrollY()
    document.body.dataset.scrollY = String(y)

    prevBodyStyles.value = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
      overscrollBehavior: document.body.style.overscrollBehavior,
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.overscrollBehavior = 'none'

    // ✅ Foco inicial robusto (evita "focus bounce" se modal já focou)
    nextTick(() => {
      const dialog = findDialog()
      if (!dialog) return

      const active = document.activeElement
      const activeIsBodyish =
        !active || active === document.body || active === document.documentElement

      // Se já estamos focados dentro do modal, não refaz foco
      if (!activeIsBodyish && dialog.contains(active)) return

      const first = dialog.querySelector(
        'button, [href], input, select, textarea, [role="slider"], [tabindex]:not([tabindex="-1"])'
      )

      ;(first || dialog)?.focus?.()
    })
  }

  const unlockBodyScroll = () => {
    // ✅ Guard contra unlock sem lock prévio (evita restaurar "lixo")
    if (!prevBodyStyles.value) return

    const y = Number.parseInt(document.body.dataset.scrollY || '0', 10) || 0

    const prev = prevBodyStyles.value
    if (prev) Object.assign(document.body.style, prev)
    prevBodyStyles.value = null

    delete document.body.dataset.scrollY
    window.scrollTo(0, y)

    nextTick(() => emitInvalidate?.({ source: 'modal-close' }))
  }

  const trapTabKeydown = (e) => {
    if (!modalOpen.value || e.key !== 'Tab') return

    if (!cachedDialog || !document.contains(cachedDialog)) {
      cachedDialog = findDialog()
      if (!cachedDialog) return

      // Helper: detecta elementos visíveis (evita pegadinha de offsetParent com position:fixed)
      const isVisible = (el) => {
        const style = getComputedStyle(el)
        if (style.display === 'none') return false
        if (style.visibility === 'hidden') return false
        // getClientRects().length > 0 significa que tem caixa renderizada (mais confiável que offsetParent)
        if (el.getClientRects().length === 0) return false
        return true
      }

      cachedFocusables = Array.from(
        cachedDialog.querySelectorAll(
          'button, [href], input, select, textarea, [role="slider"], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        if (el.disabled || el.getAttribute('aria-hidden') === 'true') return false
        let parent = el.parentElement
        while (parent && parent !== cachedDialog) {
          if (parent.getAttribute('aria-hidden') === 'true') return false
          parent = parent.parentElement
        }
        // ✅ Filtrar elementos invisíveis (Safari-friendly, evita filtrar position:fixed)
        if (!isVisible(el)) return false
        return true
      })
    }

    if (!cachedFocusables.length) return

    const first = cachedFocusables[0]
    const last = cachedFocusables[cachedFocusables.length - 1]

    if (!cachedDialog.contains(document.activeElement)) {
      e.preventDefault()
      first.focus()
      return
    }

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const handleGlobalEscape = (e) => {
    if (e.key !== 'Escape') return
    if (!modalOpen.value) return

    if (typeof onEscapeClose === 'function') {
      e.preventDefault()
      e.stopPropagation()
      onEscapeClose()
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      if (modalOpen.value) unlockBodyScroll()
    } else if (document.visibilityState === 'visible') {
      if (modalOpen.value) {
        invalidateFocusCache()
        lockBodyScroll()
      }
    }
  }

  let inertFallbackEls = []
  const initInertFallback = () => {
    if (!('inert' in HTMLElement.prototype)) {
      inertFallbackEls = Array.from(document.querySelectorAll('.inert-wrap'))
      inertFallbackEls.forEach((el) => el.setAttribute('data-inert-fallback', '1'))
    }
  }

  const applyInertFallback = (open) => {
    inertFallbackEls.forEach((el) => el.classList.toggle('is-inert', !!open))
  }

  watch(modalOpen, async (open) => {
    applyInertFallback(open)

    if (open) {
      if (portrait?.value && menuShown?.value) {
        menuShown.value = false
        document.body.classList.remove('menu-open')
      }

      previouslyFocusedEl.value = document.activeElement
      lockBodyScroll()
      document.body.classList.add('modal-open')

      invalidateFocusCache()
      document.addEventListener('keydown', trapTabKeydown, true)
      document.addEventListener('keydown', handleGlobalEscape, true)
      document.addEventListener('visibilitychange', handleVisibilityChange, true)

      if (isMenuOverlayOpen?.value) document.body.classList.remove('menu-open')
    } else {
      document.removeEventListener('keydown', trapTabKeydown, true)
      document.removeEventListener('keydown', handleGlobalEscape, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange, true)

      unlockBodyScroll()
      document.body.classList.remove('modal-open')

      await nextTick()
      requestAnimationFrame(() => {
        const el = previouslyFocusedEl.value
        previouslyFocusedEl.value = null

        if (el && document.contains(el) && typeof el.focus === 'function') {
          try {
            el.focus()
          } catch {
            /* elemento pode ter perdido focusabilidade */
          }
        } else {
          const fallback = document.querySelector('#head') || document.querySelector('#app')
          if (fallback) {
            fallback.setAttribute('tabindex', '-1')
            fallback.focus()
            fallback.removeAttribute('tabindex')
          }
        }
      })

      invalidateFocusCache()
    }
  })

  const notifyModalDomChanged = () => {
    if (modalOpen.value) invalidateFocusCache()
  }

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', trapTabKeydown, true)
    document.removeEventListener('keydown', handleGlobalEscape, true)
    document.removeEventListener('visibilitychange', handleVisibilityChange, true)

    if (modalOpen.value) {
      unlockBodyScroll()
      document.body.classList.remove('modal-open')
      applyInertFallback(false)
    }
  })

  return {
    initInertFallback,
    notifyModalDomChanged,
    invalidateFocusCache,
  }
}
