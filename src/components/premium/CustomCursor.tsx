'use client';

/**
 * CustomCursor — cursor fluido que diz o que o clique faz e cresce sobre mídia.
 *
 * O que faz:
 * - Segue o ponteiro com mola e estica na direção do movimento (quanto mais rápido, mais alongado).
 * - Vira rótulo sobre qualquer elemento com `data-cursor="View"` (ou "Drag", "Play", o texto que for).
 * - Cresce sozinho sobre imagem, vídeo e canvas; cresce um pouco sobre link e botão; some sobre campo
 *   de texto, pra não esconder o cursor de digitação.
 * - Com `blend` (padrão), usa `mix-blend-mode: difference`: o disco inverte o que está embaixo e
 *   continua visível em qualquer fundo. No estado de rótulo o disco fica sólido, pra o texto ser legível.
 * - Só existe em ponteiro fino (mouse). Em toque não renderiza nada. Com movimento reduzido, segue o
 *   ponteiro sem atraso e sem esticar.
 * - O cursor do sistema continua visível, a não ser que `hideNative` seja ligado.
 *
 * Uso (uma vez, no layout):
 *
 *   <CustomCursor />
 *
 *   <a href="/trabalhos/caso" data-cursor="View">…</a>
 *   <div data-cursor="Drag" data-cursor-size="120">…</div>
 *
 * Atributos: `data-cursor` (rótulo), `data-cursor-size` (diâmetro em px naquele elemento) e
 * `data-cursor-variant` (`media`, `link` ou `hide`, pra forçar um estado).
 * O que o rótulo informa precisa estar também no próprio elemento: em toque o cursor não existe.
 * Dependência: motion.
 */

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export interface CustomCursorProps {
  /** Diâmetro em repouso, em px. Padrão: 14. */
  size?: number;
  /** Diâmetro sobre link e botão, em px. Padrão: 44. */
  linkSize?: number;
  /** Diâmetro sobre mídia e no estado de rótulo, em px. Padrão: 96. */
  mediaSize?: number;
  /** Cor do disco. Com `blend`, usar branco. Padrão: `#ffffff`. */
  color?: string;
  /** Cor do texto do rótulo. Padrão: `#0c0c0c`. */
  labelColor?: string;
  /** Inverte o que está embaixo, pra o cursor aparecer em qualquer fundo. Padrão: `true`. */
  blend?: boolean;
  /** Estica com a velocidade. Padrão: `true`. */
  stretch?: boolean;
  /** Esconde o cursor do sistema. Padrão: `false`. */
  hideNative?: boolean;
  /** Padrão: 9999. */
  zIndex?: number;
}

type CursorVariant = 'default' | 'link' | 'media' | 'label' | 'hidden';

interface CursorState {
  variant: CursorVariant;
  label: string;
  size: number | null;
}

const REST: CursorState = { variant: 'default', label: '', size: null };

const HIDE_SELECTOR = [
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[data-cursor-variant="hide"]',
].join(', ');
const MEDIA_SELECTOR = 'img, picture, video, canvas, [data-cursor-variant="media"]';
const LINK_SELECTOR = 'a[href], button, summary, label, [role="button"], [data-cursor-variant="link"]';

const FOLLOW_SPRING = { stiffness: 500, damping: 40, mass: 0.5 };
const SHAPE_SPRING = { type: 'spring', stiffness: 260, damping: 24, mass: 0.6 } as const;

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Lê do elemento sob o ponteiro (e dos pais dele) qual estado o cursor deve assumir. */
function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return REST;
  if (target.closest(HIDE_SELECTOR)) return { variant: 'hidden', label: '', size: null };

  const sized = target.closest<HTMLElement>('[data-cursor-size]');
  const parsed = sized ? Number(sized.dataset.cursorSize) : Number.NaN;
  const size = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  const label = target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor?.trim() ?? '';
  if (label) return { variant: 'label', label, size };
  if (target.closest(MEDIA_SELECTOR)) return { variant: 'media', label: '', size };
  if (target.closest(LINK_SELECTOR)) return { variant: 'link', label: '', size };
  return REST;
}

function sameState(a: CursorState, b: CursorState): boolean {
  return a.variant === b.variant && a.label === b.label && a.size === b.size;
}

export function CustomCursor({
  size = 14,
  linkSize = 44,
  mediaSize = 96,
  color = '#ffffff',
  labelColor = '#0c0c0c',
  blend = true,
  stretch = true,
  hideNative = false,
  zIndex = 9999,
}: CustomCursorProps) {
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [state, setState] = useState<CursorState>(REST);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const current = useRef<CursorState>(REST);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, FOLLOW_SPRING);
  const springY = useSpring(pointerY, FOLLOW_SPRING);
  const x = reducedMotion ? pointerX : springX;
  const y = reducedMotion ? pointerY : springY;

  // Esticar: o disco alonga no sentido da velocidade e afina no outro eixo.
  const velocityX = useVelocity(springX);
  const velocityY = useVelocity(springY);
  const stretchAmount = useSpring(1, { stiffness: 300, damping: 30 });
  const rotate = useTransform(() => (Math.atan2(velocityY.get(), velocityX.get()) * 180) / Math.PI);
  const scaleX = useTransform(
    () => 1 + Math.min(Math.hypot(velocityX.get(), velocityY.get()) / 4000, 0.35) * stretchAmount.get(),
  );
  const scaleY = useTransform(
    () => 1 - Math.min(Math.hypot(velocityX.get(), velocityY.get()) / 8000, 0.18) * stretchAmount.get(),
  );

  useEffect(() => {
    if (!finePointer) return;
    let placed = false;
    let lastX = 0;
    let lastY = 0;
    let frame = 0;

    const apply = (next: CursorState) => {
      if (sameState(current.current, next)) return;
      current.current = next;
      setState(next);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!placed) {
        // Primeiro movimento: aparece já no lugar, sem voar a partir do canto.
        placed = true;
        springX.jump(lastX);
        springY.jump(lastY);
      }
      pointerX.set(lastX);
      pointerY.set(lastY);
      setVisible(true);
      apply(resolveState(event.target));
    };

    // A página rola por baixo do ponteiro parado: reler o que ficou embaixo dele.
    const onScroll = () => {
      if (!placed || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply(resolveState(document.elementFromPoint(lastX, lastY)));
      });
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => {
      if (placed) setVisible(true);
    };

    const page = document.documentElement;
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('blur', onLeave);
    page.addEventListener('pointerleave', onLeave);
    page.addEventListener('pointerenter', onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('blur', onLeave);
      page.removeEventListener('pointerleave', onLeave);
      page.removeEventListener('pointerenter', onEnter);
    };
  }, [finePointer, pointerX, pointerY, springX, springY]);

  const expanded = state.variant === 'label' || state.variant === 'media';

  useEffect(() => {
    stretchAmount.set(stretch && !expanded && !reducedMotion ? 1 : 0);
  }, [stretch, expanded, reducedMotion, stretchAmount]);

  if (!finePointer) return null;

  const diameter =
    state.size ?? (state.variant === 'link' ? linkSize : expanded ? mediaSize : size);
  // O disco tem sempre o tamanho máximo e encolhe por escala: só `transform`, e a borda continua nítida.
  const base = Math.max(size, linkSize, mediaSize, state.size ?? 0);
  const scale = (diameter / base) * (pressed ? 0.85 : 1);
  const shown = visible && state.variant !== 'hidden';
  const solid = state.variant === 'label';

  return (
    <>
      {hideNative && (
        <style>{`@media (hover: hover) and (pointer: fine) { *, *::before, *::after { cursor: none !important; } }`}</style>
      )}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0"
        style={{ x, y, zIndex, mixBlendMode: blend && !solid ? 'difference' : 'normal' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div className="absolute left-0 top-0" style={{ rotate, scaleX, scaleY }}>
          <motion.div
            className="absolute left-0 top-0 rounded-full"
            style={{ width: base, height: base, x: '-50%', y: '-50%', background: color }}
            initial={false}
            animate={{ scale }}
            transition={SHAPE_SPRING}
          />
        </motion.div>

        <AnimatePresence>
          {state.label && (
            <motion.span
              key={state.label}
              className="absolute left-0 top-0 whitespace-nowrap text-[11px] font-medium uppercase leading-none tracking-[0.08em]"
              style={{ x: '-50%', y: '-50%', color: labelColor }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={SHAPE_SPRING}
            >
              {state.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default CustomCursor;
