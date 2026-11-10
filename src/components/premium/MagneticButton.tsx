'use client';

/**
 * MagneticButton — botão que o ponteiro atrai, com mola (Motion, o antigo Framer Motion).
 *
 * O que faz:
 * - O ímã começa antes de o ponteiro encostar: `radius` px além da borda. O botão acompanha uma fração
 *   do deslocamento (`strength`) e o texto anda um pouco mais que o fundo, o que dá profundidade.
 * - O preenchimento entra pelo ponto em que o ponteiro entrou e sai por onde ele saiu.
 * - Tudo com mola (rigidez e amortecimento), nunca com duração fixa. Ao soltar, volta sozinho.
 * - Em toque e com movimento reduzido o ímã se desliga: fica um botão normal.
 * - Com `href` vira link (`<a>`); sem ele, `<button>`. Aceita as props nativas de cada um.
 *
 * Uso:
 *
 *   <MagneticButton background="#111111" color="#ffffff" fill="#ff4f18" fillColor="#111111">
 *     Adicionar à sacola · R$ 129
 *   </MagneticButton>
 *
 *   <MagneticButton href="/contato" variant="outline" strength={0.2}>Agendar visita</MagneticButton>
 *
 * As cores também podem vir do CSS, pelas variáveis --btn-bg, --btn-fg, --btn-fill e --btn-fill-fg.
 * Conferir o contraste do texto nos dois estados (em repouso e preenchido): mínimo de 4,5:1.
 * Um botão magnético por tela. Dependência: motion.
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type MotionStyle,
  type SpringOptions,
} from 'motion/react';
import { useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';

interface MagneticOwnProps {
  children: ReactNode;
  /** Fração do deslocamento do ponteiro que o botão acompanha, de 0 a 1. Padrão: 0,35. */
  strength?: number;
  /** Alcance do ímã em px além da borda do botão. Padrão: 64. */
  radius?: number;
  /** `solid` é a chamada principal; `outline`, a secundária. */
  variant?: 'solid' | 'outline';
  /** Mola da atração. Padrão: rigidez 180, amortecimento 14, massa 0,5. */
  spring?: SpringOptions;
  /** Cor do fundo (define --btn-bg). */
  background?: string;
  /** Cor do texto (define --btn-fg). */
  color?: string;
  /** Cor do preenchimento no hover (define --btn-fill). */
  fill?: string;
  /** Cor do texto sobre o preenchimento (define --btn-fill-fg). */
  fillColor?: string;
}

type MagneticAsButton = MagneticOwnProps &
  Omit<HTMLMotionProps<'button'>, 'children' | 'ref' | 'color'> & { href?: undefined };

type MagneticAsLink = MagneticOwnProps &
  Omit<HTMLMotionProps<'a'>, 'children' | 'ref' | 'color'> & { href: string };

export type MagneticButtonProps = MagneticAsButton | MagneticAsLink;

const DEFAULT_SPRING: SpringOptions = { stiffness: 180, damping: 14, mass: 0.5 };
const FILL_SPRING: SpringOptions = { stiffness: 220, damping: 30, mass: 0.8 };
const LABEL_EXTRA = 0.35;

const BASE_CLASS = [
  'group relative isolate inline-flex min-h-[52px] cursor-pointer select-none items-center justify-center',
  'overflow-hidden rounded-full px-8 text-[15px] font-medium leading-none tracking-tight',
  'touch-manipulation outline-none focus-visible:outline-2 focus-visible:outline-offset-4',
  'focus-visible:outline-current disabled:pointer-events-none disabled:opacity-50',
  'motion-reduce:transition-opacity motion-reduce:hover:opacity-85',
].join(' ');

const VARIANT_CLASS = {
  solid: 'bg-[color:var(--btn-bg,#111111)] text-[color:var(--btn-fg,#ffffff)]',
  outline: 'border border-current bg-transparent text-[color:var(--btn-fg,currentColor)]',
} as const;

const VARIANT_FILL = {
  solid: 'var(--btn-fill, color-mix(in srgb, var(--btn-fg, #ffffff) 18%, transparent))',
  outline: 'var(--btn-fill, color-mix(in srgb, currentColor 14%, transparent))',
} as const;

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

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

export function MagneticButton(props: MagneticButtonProps) {
  const {
    children,
    strength = 0.35,
    radius = 64,
    variant = 'solid',
    spring = DEFAULT_SPRING,
    background,
    color,
    fill,
    fillColor,
    className,
    style,
    ...rest
  } = props;

  const node = useRef<HTMLElement | null>(null);
  const setNode = useCallback((element: HTMLElement | null) => {
    node.current = element;
  }, []);

  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const disabled = 'disabled' in rest && rest.disabled === true;
  const enabled = finePointer && !reducedMotion && !disabled;

  // Posição do botão: o alvo muda com o ponteiro e a mola leva até lá.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, spring);
  const y = useSpring(targetY, spring);
  const labelX = useTransform(x, (value) => value * LABEL_EXTRA);
  const labelY = useTransform(y, (value) => value * LABEL_EXTRA);

  // Preenchimento: um círculo que cresce a partir do ponto de entrada.
  const fillX = useMotionValue(0);
  const fillY = useMotionValue(0);
  const fillSize = useMotionValue(0);
  const fillTarget = useMotionValue(0);
  const fillScale = useSpring(fillTarget, FILL_SPRING);

  useEffect(() => {
    const element = node.current;
    if (!element || !enabled) return;

    const release = () => {
      targetX.set(0);
      targetY.set(0);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      // O retângulo já vem deslocado pela própria mola: descontar pra medir a partir do repouso.
      const centerX = rect.left + rect.width / 2 - x.get();
      const centerY = rect.top + rect.height / 2 - y.get();
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const inside = Math.abs(dx) < rect.width / 2 + radius && Math.abs(dy) < rect.height / 2 + radius;
      if (inside) {
        targetX.set(dx * strength);
        targetY.set(dy * strength);
      } else {
        release();
      }
    };

    const placeFill = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      fillX.set(event.clientX - rect.left);
      fillY.set(event.clientY - rect.top);
      // Duas diagonais: cobre o botão inteiro, entre por onde entrar.
      fillSize.set(Math.hypot(rect.width, rect.height) * 2);
    };
    const onEnter = (event: PointerEvent) => {
      placeFill(event);
      fillTarget.set(1);
    };
    const onLeave = (event: PointerEvent) => {
      placeFill(event);
      fillTarget.set(0);
    };

    // Só escuta o ponteiro enquanto o botão está na tela.
    let listening = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) window.addEventListener('pointermove', onMove, { passive: true });
      else window.removeEventListener('pointermove', onMove);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        listen(entry.isIntersecting);
        if (!entry.isIntersecting) release();
      }
    });
    observer.observe(element);
    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointerleave', onLeave);
    document.documentElement.addEventListener('pointerleave', release);

    return () => {
      observer.disconnect();
      listen(false);
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeEventListener('pointerleave', release);
      release();
      fillTarget.set(0);
    };
  }, [enabled, radius, strength, targetX, targetY, x, y, fillX, fillY, fillSize, fillTarget]);

  const variables: Record<string, string> = {};
  if (background) variables['--btn-bg'] = background;
  if (color) variables['--btn-fg'] = color;
  if (fill) variables['--btn-fill'] = fill;
  if (fillColor) variables['--btn-fill-fg'] = fillColor;

  const classes = cx(BASE_CLASS, VARIANT_CLASS[variant], className);
  const motionStyle: MotionStyle = { ...(variables as MotionStyle), ...style, x, y };

  const content = (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -z-10 rounded-full"
        style={{
          left: fillX,
          top: fillY,
          width: fillSize,
          height: fillSize,
          x: '-50%',
          y: '-50%',
          scale: fillScale,
          background: VARIANT_FILL[variant],
        }}
      />
      <motion.span
        className="relative inline-flex items-center gap-2 transition-colors duration-300 group-hover:text-[color:var(--btn-fill-fg,inherit)]"
        style={{ x: labelX, y: labelY }}
      >
        {children}
      </motion.span>
    </>
  );

  if (rest.href !== undefined) {
    return (
      <motion.a ref={setNode} whileTap={{ scale: 0.96 }} {...rest} className={classes} style={motionStyle}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={setNode}
      type="button"
      whileTap={{ scale: 0.96 }}
      {...rest}
      className={classes}
      style={motionStyle}
    >
      {content}
    </motion.button>
  );
}

export default MagneticButton;
