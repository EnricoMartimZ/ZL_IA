'use client';

/**
 * SmoothScrollContainer — Lenis + GSAP ScrollTrigger na página toda, com seção fixada e texto revelado.
 *
 * Três peças no mesmo arquivo:
 * - `SmoothScrollContainer`: uma instância do Lenis, ligada ao relógio do GSAP e ao ScrollTrigger.
 *   Vai uma vez, no layout. Em toque a rolagem continua nativa; com movimento reduzido o Lenis nem liga.
 * - `PinnedSection`: prende a seção na tela por N alturas de tela e entrega o progresso (0 a 1) numa
 *   variável CSS `--progress`, num callback e numa timeline com scrub.
 * - `SplitReveal`: revela o texto caractere por caractere, palavra por palavra ou linha por linha
 *   (GSAP SplitText), subindo de trás de uma máscara ou escurecendo com a rolagem. O texto original
 *   continua disponível pro leitor de tela.
 *
 * Uso:
 *
 *   // app/layout.tsx
 *   <SmoothScrollContainer>{children}</SmoothScrollContainer>
 *
 *   // numa página
 *   <SplitReveal as="h1" by="chars" className="text-8xl">Título que entra letra a letra</SplitReveal>
 *
 *   <PinnedSection
 *     length={2}
 *     className="h-svh"
 *     build={(timeline, section) => {
 *       timeline.to(section.querySelectorAll('[data-step]'), { autoAlpha: 1, stagger: 1 });
 *     }}
 *   >
 *     …
 *   </PinnedSection>
 *
 * Dependências: gsap (3.13 ou mais novo, com SplitText incluído), @gsap/react, lenis.
 */

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

const NO_PREFERENCE = '(prefers-reduced-motion: no-preference)';
const REDUCE = '(prefers-reduced-motion: reduce)';

type SplitVars = NonNullable<Parameters<typeof SplitText.create>[1]>;

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------------------------------------
 * Rolagem suave
 * --------------------------------------------------------------------------------------------- */

export type ScrollTarget = number | string | HTMLElement;

export interface ScrollToOptions {
  /** Distância em px a somar ao destino (negativa pra descontar um cabeçalho fixo). */
  offset?: number;
  /** Pula a animação. */
  immediate?: boolean;
  /** Duração em segundos. Sem ela, vale o `lerp` do container. */
  duration?: number;
}

export interface SmoothScrollApi {
  /** A instância do Lenis, ou `null` quando a rolagem é nativa. Ler dentro de efeito ou de callback. */
  readonly lenis: Lenis | null;
  /** Rola até um número (px), um seletor ou um elemento. Funciona também sem o Lenis. */
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
  /** Trava a rolagem (menu aberto, modal). */
  stop: () => void;
  /** Libera a rolagem. */
  start: () => void;
}

function nativeScrollTo(target: ScrollTarget, options: ScrollToOptions = {}): void {
  const offset = options.offset ?? 0;
  const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  const top =
    typeof element === 'number'
      ? element
      : element
        ? element.getBoundingClientRect().top + window.scrollY
        : window.scrollY;
  const reduce = window.matchMedia(REDUCE).matches;
  window.scrollTo({ top: top + offset, behavior: options.immediate || reduce ? 'auto' : 'smooth' });
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  lenis: null,
  scrollTo: nativeScrollTo,
  stop: () => undefined,
  start: () => undefined,
});

/** Acesso à rolagem suave de qualquer componente filho do container. */
export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}

export interface SmoothScrollContainerProps {
  children: ReactNode;
  /** Suavidade: 0,1 é o padrão; 0,06 a 0,08 deixa a rolagem mais pesada e lenta. */
  lerp?: number;
  /** Multiplicador da roda do mouse. Padrão: 1. */
  wheelMultiplier?: number;
  /** Desliga o Lenis e mantém a rolagem nativa (o ScrollTrigger continua funcionando). */
  disabled?: boolean;
}

export function SmoothScrollContainer({
  children,
  lerp = 0.1,
  wheelMultiplier = 1,
  disabled = false,
}: SmoothScrollContainerProps) {
  const instance = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (disabled || window.matchMedia(REDUCE).matches) return;

    const lenis = new Lenis({
      lerp,
      wheelMultiplier,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
      stopInertiaOnNavigate: true,
    });
    instance.current = lenis;

    // O Lenis anda no relógio do GSAP e avisa o ScrollTrigger a cada passo: os dois nunca dessincronizam.
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      instance.current = null;
    };
  }, [disabled, lerp, wheelMultiplier]);

  // As medidas mudam quando a fonte carrega e quando a rota troca.
  useEffect(() => {
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    instance.current?.resize();
    ScrollTrigger.refresh();
  }, [pathname]);

  const api = useMemo<SmoothScrollApi>(
    () => ({
      get lenis() {
        return instance.current;
      },
      scrollTo(target, options) {
        const lenis = instance.current;
        if (lenis) lenis.scrollTo(target, options);
        else nativeScrollTo(target, options);
      },
      stop() {
        instance.current?.stop();
      },
      start() {
        instance.current?.start();
      },
    }),
    [],
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}

/* ------------------------------------------------------------------------------------------------
 * Seção fixada
 * --------------------------------------------------------------------------------------------- */

export interface PinnedSectionProps {
  children: ReactNode;
  /** Por quantas alturas de tela a seção fica presa. Padrão: 1,5. */
  length?: number;
  /** `true` cola a animação na rolagem; um número (segundos) dá o atraso de acompanhamento. Padrão: 0,6. */
  scrub?: boolean | number;
  /** Quando prender, no formato do ScrollTrigger. Padrão: `top top`. */
  start?: string;
  /** Monta a animação da seção: tudo que entrar na timeline acompanha a rolagem. */
  build?: (timeline: gsap.core.Timeline, section: HTMLElement) => void;
  /** Progresso de 0 a 1 a cada passo. */
  onProgress?: (progress: number) => void;
  className?: string;
  id?: string;
}

export function PinnedSection({
  children,
  length = 1.5,
  scrub = 0.6,
  start = 'top top',
  build,
  onProgress,
  className,
  id,
}: PinnedSectionProps) {
  const root = useRef<HTMLElement>(null);
  const callbacks = useRef({ build, onProgress });

  useEffect(() => {
    callbacks.current = { build, onProgress };
  });

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const media = gsap.matchMedia();

      media.add(NO_PREFERENCE, () => {
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start,
            end: () => `+=${Math.round(window.innerHeight * length)}`,
            pin: true,
            scrub,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              section.style.setProperty('--progress', self.progress.toFixed(4));
              callbacks.current.onProgress?.(self.progress);
            },
          },
        });
        section.style.setProperty('--progress', '0');
        callbacks.current.build?.(timeline, section);
      });

      // Movimento reduzido: nada prende. O conteúdo aparece no estado final, no fluxo normal.
      media.add(REDUCE, () => {
        section.style.setProperty('--progress', '1');
        callbacks.current.onProgress?.(1);
      });

      return () => media.revert();
    },
    { scope: root, dependencies: [length, scrub, start], revertOnUpdate: true },
  );

  return (
    <section ref={root} id={id} className={cx('relative', className)}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Texto revelado
 * --------------------------------------------------------------------------------------------- */

export type SplitRevealTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';

export interface SplitRevealProps {
  children: ReactNode;
  /** Elemento do texto. Padrão: `p`. */
  as?: SplitRevealTag;
  /** Unidade que entra: caractere, palavra ou linha. Padrão: `chars`. */
  by?: 'chars' | 'words' | 'lines';
  /** `rise` sobe de trás da máscara ao entrar na tela; `scrub` escurece conforme a rolagem. */
  mode?: 'rise' | 'scrub';
  /** Intervalo entre unidades, em segundos. Padrão: 0,018 (caractere), 0,06 (palavra), 0,12 (linha). */
  stagger?: number;
  /** Duração de cada unidade no modo `rise`, em segundos. Padrão: 0,9. */
  duration?: number;
  /** Espera antes de começar, em segundos. */
  delay?: number;
  /** Quando disparar, no formato do ScrollTrigger. Padrão: `top 85%`. */
  start?: string;
  /** Anima só na primeira vez. Padrão: `true`. */
  once?: boolean;
  /**
   * Esconde o texto até a animação estar pronta. Ligar só no texto da primeira dobra, onde ele piscaria
   * antes de animar. Sem JavaScript esse texto não aparece.
   */
  hideUntilReady?: boolean;
  className?: string;
}

const DEFAULT_STAGGER = { chars: 0.018, words: 0.06, lines: 0.12 } as const;

export function SplitReveal({
  children,
  as: Tag = 'p',
  by = 'chars',
  mode = 'rise',
  stagger,
  duration = 0.9,
  delay = 0,
  start = 'top 85%',
  once = true,
  hideUntilReady = false,
  className,
}: SplitRevealProps) {
  const root = useRef<HTMLElement | null>(null);
  const setRoot = (node: HTMLElement | null) => {
    root.current = node;
  };

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const media = gsap.matchMedia();
      const gap = stagger ?? DEFAULT_STAGGER[by];

      media.add(NO_PREFERENCE, () => {
        const vars: SplitVars = {
          // Dividir também em palavras e linhas impede que uma palavra quebre no meio.
          type: by === 'chars' ? 'lines,words,chars' : by === 'words' ? 'lines,words' : 'lines',
          autoSplit: true,
          aria: 'auto',
          onSplit: (self) => {
            const pieces = by === 'chars' ? self.chars : by === 'words' ? self.words : self.lines;
            gsap.set(element, { autoAlpha: 1 });

            if (mode === 'scrub') {
              return gsap.fromTo(
                pieces,
                { opacity: 0.18 },
                {
                  opacity: 1,
                  ease: 'none',
                  stagger: gap,
                  scrollTrigger: { trigger: element, start, end: 'bottom 55%', scrub: 0.4 },
                },
              );
            }

            return gsap.from(pieces, {
              yPercent: 110,
              duration,
              delay,
              ease: 'expo.out',
              stagger: gap,
              scrollTrigger: {
                trigger: element,
                start,
                once,
                toggleActions: once ? 'play none none none' : 'play none none reverse',
              },
            });
          },
        };
        if (mode === 'rise') vars.mask = 'lines';

        const split = SplitText.create(element, vars);
        return () => split.revert();
      });

      media.add(REDUCE, () => {
        gsap.set(element, { autoAlpha: 1 });
      });

      return () => media.revert();
    },
    { scope: root, dependencies: [by, mode, stagger, duration, delay, start, once], revertOnUpdate: true },
  );

  return (
    <Tag ref={setRoot} className={className} style={hideUntilReady ? { visibility: 'hidden' } : undefined}>
      {children}
    </Tag>
  );
}

export default SmoothScrollContainer;
