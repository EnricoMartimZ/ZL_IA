'use client';

/**
 * Hero3DCanvas — primeira dobra com um objeto abstrato de vidro que refrata a luz do fundo.
 *
 * O que faz:
 * - Shader próprio em GLSL: o fundo (manchas de luz) é desenhado numa textura e o vidro lê essa textura
 *   com um desvio por canal de cor (refração com dispersão), mais reflexo de borda, brilho e fosco opcional.
 * - O objeto gira sozinho e segue o ponteiro com interpolação amortecida (independe do FPS).
 * - Um véu na cor do fundo (`veil`) fica entre o vidro e o conteúdo, pra o texto não perder contraste.
 * - Mede o próprio FPS. Abaixo de `minFps`: primeiro reduz DPR e amostras do shader; se não recuperar,
 *   desmonta o canvas e fica o pôster estático.
 * - Sem WebGL2, com contexto perdido, economia de dados ou movimento reduzido: pôster direto.
 * - O pôster vem no HTML do servidor (não atrasa o LCP); o canvas monta depois, só no cliente, e pausa
 *   fora da tela.
 *
 * Uso (o import direto funciona em Server Component; a altura quem dá é o `className`):
 *
 *   <Hero3DCanvas className="grid h-svh place-items-center" palette={['#5b8cff', '#c8ff4d', '#ff4f18']}>
 *     <h1 className="text-7xl text-white">Título</h1>
 *   </Hero3DCanvas>
 *
 * Pra tirar o Three.js da primeira carga, importar com `next/dynamic` dentro de um Client Component:
 *   const Hero3DCanvas = dynamic(() => import('@/components/premium/Hero3DCanvas'), { ssr: false });
 *
 * Cores em hex, `rgb()` ou `hsl()`. Dependências: three, @react-three/fiber.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Color,
  LinearSRGBColorSpace,
  MathUtils,
  Vector2,
  WebGLRenderTarget,
  type Mesh,
  type ShaderMaterial,
} from 'three';

export type Hero3DShape = 'knot' | 'torus' | 'sphere';

export type Hero3DFallbackReason = 'no-webgl' | 'low-fps' | 'context-lost' | 'reduced-motion' | 'save-data';

export type Hero3DPalette = readonly [string, string, string];

export interface Hero3DCanvasProps {
  /** Conteúdo por cima do canvas: título, texto, botão. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Forma do objeto. Padrão: `knot`. */
  shape?: Hero3DShape;
  /** Tamanho do objeto, de 0,3 a 1,2 (1 ocupa quase toda a altura). Padrão: 0,85. */
  scale?: number;
  /** Posição do objeto em fração da meia-tela: `[0.5, 0]` leva pro meio da metade direita. Padrão: `[0, 0]`. */
  offset?: readonly [number, number];
  /** Cor de fundo. Padrão: `#09090b`. */
  background?: string;
  /** As três luzes do fundo, que o vidro refrata. */
  palette?: Hero3DPalette;
  /** Índice de refração, de 1,05 a 1,6. Padrão: 1,22. */
  ior?: number;
  /** Separação de cores na refração, de 0 a 0,1. Padrão: 0,04. */
  dispersion?: number;
  /** 0 é vidro limpo, 1 é vidro fosco. Padrão: 0. */
  frost?: number;
  /** Velocidade do giro e das luzes. Padrão: 1. */
  speed?: number;
  /** Quanto o objeto segue o ponteiro, de 0 a 1. Padrão: 0,6. */
  pointerStrength?: number;
  /** Mostrar as luzes do fundo na tela. Com `false`, o canvas fica transparente e só o vidro aparece. */
  backdrop?: boolean;
  /** Força das luzes do fundo na tela, de 0 a 1 (o vidro sempre refrata a luz cheia). Padrão: 0,55. */
  backdropIntensity?: number;
  /** Véu na cor do fundo atrás do conteúdo, de 0 a 1, pra garantir o contraste do texto. Padrão: 0,3. */
  veil?: number;
  /** Abaixo disso a qualidade cai e, persistindo, entra o pôster. Padrão: 30. */
  minFps?: number;
  /** Teto de densidade de pixels. Em toque o teto é 1,5. Padrão: 2. */
  maxDpr?: number;
  /** Conteúdo do pôster estático (uma imagem, por exemplo). Sem ele, um degradê com as mesmas cores. */
  poster?: ReactNode;
  /** Avisa quando o pôster assumiu, e por quê. */
  onFallback?: (reason: Hero3DFallbackReason) => void;
}

interface Quality {
  dpr: number;
  samples: number;
  detail: number;
  bufferScale: number;
}

const DEFAULT_PALETTE: Hero3DPalette = ['#5b8cff', '#c8ff4d', '#ff4f18'];
const DEFAULT_OFFSET: readonly [number, number] = [0, 0];
const LAST_TIER = 2;

const BACKDROP_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform float uGain;
  uniform vec2 uPointer;
  uniform vec3 uBackground;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float blob(vec2 p, vec2 center, float radius) {
    return smoothstep(radius, 0.0, length(p - center));
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float t = uTime * 0.12;

    vec2 a = vec2(-0.45 + 0.18 * sin(t * 1.3), 0.22 + 0.14 * cos(t * 0.9));
    vec2 b = vec2(0.42 + 0.16 * cos(t * 1.1), -0.18 + 0.16 * sin(t * 1.4));
    vec2 c = vec2(0.05 + 0.22 * sin(t * 0.7 + 2.0), 0.05 + 0.2 * cos(t * 0.6 + 1.0)) + uPointer * 0.12;

    vec3 color = uBackground;
    color = mix(color, uColorA, blob(p, a, 0.78) * 0.85 * uGain);
    color = mix(color, uColorB, blob(p, b, 0.72) * 0.8 * uGain);
    color = mix(color, uColorC, blob(p, c, 0.56) * 0.7 * uGain);

    // Faixas finas de luz: dão ao vidro o que entortar.
    float band = sin((p.x * 0.8 + p.y * 1.6) * 14.0 + sin(p.y * 3.0 + t * 2.0) * 1.5);
    color += 0.07 * uGain * smoothstep(0.9, 1.0, band);

    color = mix(color, uBackground, smoothstep(0.6, 1.3, length(p)));
    color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const GLASS_VERTEX = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const GLASS_FRAGMENT = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uIor;
  uniform float uDispersion;
  uniform float uFrost;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Direção no mundo -> desvio na tela, compensando a proporção.
  vec2 toScreen(vec3 direction) {
    vec2 d = (viewMatrix * vec4(direction, 0.0)).xy;
    return d * vec2(uResolution.y / uResolution.x, 1.0);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 n = normalize(vWorldNormal);
    vec3 v = normalize(vViewDirection);

    // Cada canal entra no vidro com um índice um pouco diferente: é isso que separa as cores na borda.
    vec2 red = toScreen(refract(v, n, 1.0 / (uIor - uDispersion)));
    vec2 green = toScreen(refract(v, n, 1.0 / uIor));
    vec2 blue = toScreen(refract(v, n, 1.0 / (uIor + uDispersion)));

    vec3 color = vec3(0.0);
    for (int i = 0; i < SAMPLES; i++) {
      float t = float(i) / float(SAMPLES);
      vec2 grain = vec2(hash(gl_FragCoord.xy + t * 91.7), hash(gl_FragCoord.yx - t * 47.3)) - 0.5;
      grain *= uFrost * 0.09;
      float reach = 0.34 * (1.0 + t * 0.6);
      color.r += texture2D(uScene, uv + red * reach + grain).r;
      color.g += texture2D(uScene, uv + green * reach * (1.0 + uDispersion) + grain).g;
      color.b += texture2D(uScene, uv + blue * reach * (1.0 + 2.0 * uDispersion) + grain).b;
    }
    color /= float(SAMPLES);

    // Borda: quanto mais rasante o olhar, mais o vidro reflete em vez de refratar.
    float fresnel = pow(1.0 - clamp(dot(-v, n), 0.0, 1.0), 3.0);
    vec3 reflection = reflect(v, n);
    vec3 mirrored = texture2D(uScene, uv + toScreen(reflection) * 0.35).rgb;
    color = mix(color, mirrored * 1.25 + 0.06, fresnel * 0.65);

    // Ponto de brilho, que acompanha o ponteiro.
    vec3 light = normalize(vec3(uPointer * 1.4 + vec2(-0.4, 0.7), 1.0));
    color += pow(max(dot(reflection, light), 0.0), 90.0) * 0.9;
    color += fresnel * 0.08;

    // Fosco: levemente leitoso.
    color = mix(color, color * 0.92 + 0.05, uFrost);

    gl_FragColor = vec4(color, 1.0);
  }
`;

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

/** O que impede o WebGL antes mesmo de tentar. */
function unsupportedReason(): Hero3DFallbackReason | null {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return 'save-data';
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    if (!probe) return 'no-webgl';
    probe.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return 'no-webgl';
  }
  return null;
}

function qualityFor(tier: number, maxDpr: number, coarse: boolean): Quality {
  const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const ceiling = coarse ? Math.min(maxDpr, 1.5) : maxDpr;
  if (tier <= 0) return { dpr: Math.min(device, ceiling), samples: coarse ? 4 : 8, detail: 1, bufferScale: 0.5 };
  if (tier === 1) return { dpr: Math.min(device, 1.25), samples: 4, detail: 0.6, bufferScale: 0.5 };
  return { dpr: 1, samples: 2, detail: 0.4, bufferScale: 0.35 };
}

function posterBackground(background: string, palette: Hero3DPalette, intensity: number): string {
  const soft = (color: string, amount: number) =>
    `color-mix(in srgb, ${color} ${Math.round(amount * intensity * 100)}%, transparent)`;
  return [
    `radial-gradient(60% 75% at 24% 34%, ${soft(palette[0], 0.85)}, transparent 70%)`,
    `radial-gradient(55% 70% at 78% 62%, ${soft(palette[1], 0.8)}, transparent 70%)`,
    `radial-gradient(40% 50% at 52% 48%, ${soft(palette[2], 0.7)}, transparent 70%)`,
    background,
  ].join(', ');
}

/** Cor em valores de tela (sRGB), sem conversão: o shader trabalha direto nesse espaço, como o CSS. */
function displayColor(value: string): Color {
  return new Color().setStyle(value, LinearSRGBColorSpace);
}

function uniformOf<T>(material: ShaderMaterial | null, name: string): { value: T } | undefined {
  return material?.uniforms[name] as { value: T } | undefined;
}

function setUniform<T>(material: ShaderMaterial | null, name: string, value: T): void {
  const uniform = uniformOf<T>(material, name);
  if (uniform) uniform.value = value;
}

interface FpsGuardProps {
  minFps: number;
  onLow: () => void;
}

/** Média de FPS a cada segundo. Duas janelas seguidas abaixo do mínimo disparam `onLow`. */
function FpsGuard({ minFps, onLow }: FpsGuardProps) {
  const meter = useRef({ frames: 0, time: 0, warmup: 0, strikes: 0 });

  useFrame((_, delta) => {
    const m = meter.current;
    if (delta > 1) {
      // A aba voltou do fundo ou o canvas voltou pra tela: esse salto não é queda de desempenho.
      m.frames = 0;
      m.time = 0;
      return;
    }
    if (m.warmup < 1) {
      // Primeiro segundo: compilação de shader e montagem. Não conta.
      m.warmup += delta;
      return;
    }
    m.frames += 1;
    m.time += delta;
    if (m.time < 1) return;

    const fps = m.frames / m.time;
    m.frames = 0;
    m.time = 0;
    // Um quadro de folga: tela travada em 30 quadros (economia de energia do celular) não é queda.
    if (fps >= minFps - 1) {
      m.strikes = 0;
      return;
    }
    m.strikes += 1;
    if (m.strikes >= 2) {
      m.strikes = 0;
      m.warmup = 0;
      onLow();
    }
  });

  return null;
}

interface GlassSceneProps {
  shape: Hero3DShape;
  objectScale: number;
  offset: readonly [number, number];
  background: string;
  palette: Hero3DPalette;
  ior: number;
  dispersion: number;
  frost: number;
  speed: number;
  pointerStrength: number;
  backdrop: boolean;
  backdropIntensity: number;
  quality: Quality;
  onReady: () => void;
}

function GlassScene({
  shape,
  objectScale,
  offset,
  background,
  palette,
  ior,
  dispersion,
  frost,
  speed,
  pointerStrength,
  backdrop,
  backdropIntensity,
  quality,
  onReady,
}: GlassSceneProps) {
  const glass = useRef<Mesh>(null);
  const backdropMesh = useRef<Mesh>(null);
  const glassMaterial = useRef<ShaderMaterial>(null);
  const backdropMaterial = useRef<ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const clock = useRef(0);
  const frames = useRef(0);
  const bufferSize = useRef(new Vector2());
  const viewport = useThree((state) => state.viewport);

  // Textura onde o fundo é desenhado pra o vidro refratar. Metade da resolução basta: o fundo é macio.
  const target = useMemo(() => new WebGLRenderTarget(2, 2, { depthBuffer: false }), []);
  useEffect(() => () => target.dispose(), [target]);

  const backdropUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uGain: { value: 1 },
      uPointer: { value: new Vector2() },
      uBackground: { value: new Color() },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() },
    }),
    [],
  );

  const glassUniforms = useMemo(
    () => ({
      uScene: { value: target.texture },
      uResolution: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2() },
      uIor: { value: 1.22 },
      uDispersion: { value: 0.04 },
      uFrost: { value: 0 },
    }),
    [target],
  );

  useEffect(() => {
    const material = backdropMaterial.current;
    uniformOf<Color>(material, 'uBackground')?.value.copy(displayColor(background));
    uniformOf<Color>(material, 'uColorA')?.value.copy(displayColor(palette[0]));
    uniformOf<Color>(material, 'uColorB')?.value.copy(displayColor(palette[1]));
    uniformOf<Color>(material, 'uColorC')?.value.copy(displayColor(palette[2]));
  }, [background, palette]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, rawDelta) => {
    const mesh = glass.current;
    const back = backdropMesh.current;
    const glassShader = glassMaterial.current;
    const backdropShader = backdropMaterial.current;
    if (!mesh || !back || !glassShader || !backdropShader) return;

    const delta = Math.min(rawDelta, 0.1);
    clock.current += delta * speed;
    const time = clock.current;

    // Interpolação amortecida: o mesmo movimento a 30 ou a 120 quadros por segundo.
    const p = pointer.current;
    p.x = MathUtils.damp(p.x, p.targetX, 4, delta);
    p.y = MathUtils.damp(p.y, p.targetY, 4, delta);

    mesh.rotation.x = time * 0.15 + Math.sin(time * 0.4) * 0.15 - p.y * 0.5 * pointerStrength;
    mesh.rotation.y = time * 0.22 + p.x * 0.7 * pointerStrength;
    mesh.position.x = (offset[0] * state.viewport.width) / 2 + p.x * 0.28 * pointerStrength;
    mesh.position.y =
      (offset[1] * state.viewport.height) / 2 + p.y * 0.2 * pointerStrength + Math.sin(time * 0.6) * 0.05;

    const size = state.gl.getDrawingBufferSize(bufferSize.current);
    const width = Math.max(2, Math.round(size.x * quality.bufferScale));
    const height = Math.max(2, Math.round(size.y * quality.bufferScale));
    if (target.width !== width || target.height !== height) target.setSize(width, height);

    uniformOf<Vector2>(glassShader, 'uResolution')?.value.copy(size);
    uniformOf<Vector2>(glassShader, 'uPointer')?.value.set(p.x, p.y);
    setUniform(glassShader, 'uIor', MathUtils.clamp(ior, 1.05, 1.6));
    setUniform(glassShader, 'uDispersion', MathUtils.clamp(dispersion, 0, 0.1));
    setUniform(glassShader, 'uFrost', MathUtils.clamp(frost, 0, 1));
    setUniform(backdropShader, 'uTime', time);
    setUniform(backdropShader, 'uAspect', size.x / size.y);
    uniformOf<Vector2>(backdropShader, 'uPointer')?.value.set(p.x, p.y);

    // Passo 1: só o fundo, com a luz cheia, na textura que o vidro vai refratar.
    mesh.visible = false;
    back.visible = true;
    setUniform(backdropShader, 'uGain', 1);
    state.gl.setRenderTarget(target);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);

    // Passo 2: a cena inteira vai pra tela no desenho padrão do React Three Fiber, logo depois daqui.
    mesh.visible = true;
    back.visible = backdrop;
    setUniform(backdropShader, 'uGain', MathUtils.clamp(backdropIntensity, 0, 1));

    frames.current += 1;
    if (frames.current === 2) onReady();
  });

  const scale = Math.min(viewport.width / 3.4, viewport.height / 3.78, 1) * MathUtils.clamp(objectScale, 0.3, 1.2);
  const detail = quality.detail;

  return (
    <>
      <mesh ref={backdropMesh} frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={backdropMaterial}
          uniforms={backdropUniforms}
          vertexShader={BACKDROP_VERTEX}
          fragmentShader={BACKDROP_FRAGMENT}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={glass} scale={scale}>
        {shape === 'knot' && (
          <torusKnotGeometry args={[1, 0.36, Math.round(220 * detail), Math.round(32 * detail), 2, 3]} />
        )}
        {shape === 'torus' && (
          <torusGeometry args={[1.05, 0.46, Math.round(48 * detail), Math.round(128 * detail)]} />
        )}
        {shape === 'sphere' && <icosahedronGeometry args={[1.3, Math.round(24 * detail)]} />}
        <shaderMaterial
          key={quality.samples}
          ref={glassMaterial}
          uniforms={glassUniforms}
          defines={{ SAMPLES: quality.samples }}
          vertexShader={GLASS_VERTEX}
          fragmentShader={GLASS_FRAGMENT}
        />
      </mesh>
    </>
  );
}

export function Hero3DCanvas({
  children,
  className,
  style,
  shape = 'knot',
  scale = 0.85,
  offset = DEFAULT_OFFSET,
  background = '#09090b',
  palette = DEFAULT_PALETTE,
  ior = 1.22,
  dispersion = 0.04,
  frost = 0,
  speed = 1,
  pointerStrength = 0.6,
  backdrop = true,
  backdropIntensity = 0.55,
  veil = 0.3,
  minFps = 30,
  maxDpr = 2,
  poster,
  onFallback,
}: Hero3DCanvasProps) {
  const root = useRef<HTMLDivElement>(null);
  const tierRef = useRef(0);
  const onFallbackRef = useRef(onFallback);

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const coarse = useMediaQuery('(pointer: coarse)');

  const [started, setStarted] = useState(false);
  const [failure, setFailure] = useState<Hero3DFallbackReason | null>(null);
  const [tier, setTier] = useState(0);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);

  const reason: Hero3DFallbackReason | null = failure ?? (reducedMotion ? 'reduced-motion' : null);
  const webgl = started && reason === null;

  useEffect(() => {
    onFallbackRef.current = onFallback;
  });

  useEffect(() => {
    if (reason) onFallbackRef.current?.(reason);
  }, [reason]);

  // O canvas só começa depois que a página hidratou e o navegador ficou ocioso: o pôster segura a dobra.
  useEffect(() => {
    const begin = () => {
      const blocked = unsupportedReason();
      if (blocked) setFailure(blocked);
      else setStarted(true);
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(begin, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(begin, 200);
    return () => window.clearTimeout(id);
  }, []);

  // Fora da tela o canvas para de desenhar.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) setInView(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleLowFps = useCallback(() => {
    if (tierRef.current >= LAST_TIER) {
      setFailure('low-fps');
      return;
    }
    tierRef.current += 1;
    setTier(tierRef.current);
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  const quality = qualityFor(tier, maxDpr, coarse);

  return (
    <div
      ref={root}
      className={cx('relative isolate overflow-hidden', className)}
      style={style}
      data-hero3d={webgl ? 'webgl' : 'poster'}
      data-hero3d-tier={tier}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{ background: posterBackground(background, palette, backdrop ? backdropIntensity : 0) }}
      >
        {poster}
      </div>

      {webgl && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <Canvas
            flat
            dpr={quality.dpr}
            frameloop={inView ? 'always' : 'never'}
            camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 50 }}
            gl={{ antialias: !coarse, alpha: true, stencil: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                setFailure('context-lost');
              });
            }}
          >
            <FpsGuard minFps={minFps} onLow={handleLowFps} />
            <GlassScene
              shape={shape}
              objectScale={scale}
              offset={offset}
              background={background}
              palette={palette}
              ior={ior}
              dispersion={dispersion}
              frost={frost}
              speed={speed}
              pointerStrength={pointerStrength}
              backdrop={backdrop}
              backdropIntensity={backdropIntensity}
              quality={quality}
              onReady={handleReady}
            />
          </Canvas>
        </div>
      )}

      {veil > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(closest-side, color-mix(in srgb, ${background} ${Math.round(
              Math.min(veil, 1) * 100,
            )}%, transparent), transparent)`,
          }}
        />
      )}

      {children}
    </div>
  );
}

export default Hero3DCanvas;
