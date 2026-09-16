import { useEffect, useRef } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';

// Efecto "túnel de rayos en perspectiva" inspirado en composio.dev, adaptado al
// hero CLARO de Starteria (ver ADR-019 + propuesta de mejora del landing):
//  - shader WebGL 1:1 vía OGL (~10kb), no Three.js,
//  - paleta de marca restringida (azul Starteria + acento cian/índigo sutil),
//  - canvas transparente sobre el hero blanco; el centro queda limpio para que
//    el titular siga legible (viñeta radial) y los bordes hacen fade,
//  - respeta prefers-reduced-motion: pinta un único frame estático, sin loop.
//
// El componente se monta como capa absoluta DETRÁS del contenido del hero.

const VERT = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;

  const float PI = 3.14159265359;

  void main() {
    // Coordenadas centradas, normalizadas por la altura.
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    // Punto de fuga ligeramente sobre el centro (detrás del titular).
    uv.y += 0.06;
    // Elonga el campo en horizontal -> los rayos abren como corredor.
    uv.x *= 0.55;

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Rayos angulares (radios anchos que irradian del punto de fuga).
    float spokes = 26.0;
    float ang = a / (2.0 * PI) + 0.5;
    float bars = ang * spokes;
    float seg = floor(bars);
    float fb = fract(bars);
    // Barras más anchas y de borde nítido -> haces sólidos, no hilos.
    float barMask = smoothstep(0.03, 0.14, fb) * smoothstep(0.03, 0.14, 1.0 - fb);

    // Bloques extruidos que viajan por el radio, con PISO de brillo: el haz
    // siempre se ve y los segmentos brillantes lo recorren (no parpadeo a cero).
    float blockRaw = 0.5 + 0.5 * sin(r * 16.0 - uTime * 1.1 + seg);
    float blocks = mix(0.45, 1.0, smoothstep(0.2, 1.0, blockRaw));
    // Parpadeo suave por rayo (modula, no apaga).
    float flick = 0.75 + 0.25 * sin(uTime * 0.6 + seg * 1.7);

    float depth = smoothstep(0.0, 0.85, r);
    float streaks = barMask * flick * blocks * depth;

    // Color de marca mezclado por rayo y tiempo (azul -> cian).
    vec3 col = mix(uColorA, uColorB, 0.5 + 0.5 * sin(seg * 0.5 + uTime * 0.2));

    // Viñeta: centro limpio (titular legible) pero la banda arranca más cerca,
    // y se extiende hacia las esquinas para llenar el hero.
    float centerClear = smoothstep(0.0, 0.30, r);
    float edgeFade = 1.0 - smoothstep(0.95, 1.5, r);
    float alpha = streaks * centerClear * edgeFade * uIntensity;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

// Azul de marca intenso (#2563eb, blue-600) + acento cian-cielo (#0ea5e9,
// sky-500). Más saturados que el set inicial para que el haz lea sobre blanco.
const COLOR_A: [number, number, number] = [0.149, 0.388, 0.922];
const COLOR_B: [number, number, number] = [0.055, 0.647, 0.914];

export function HeroTunnel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uColorA: { value: COLOR_A },
        uColorB: { value: COLOR_B },
        uIntensity: { value: 1.1 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    window.addEventListener('resize', resize);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    const render = (t: number) => {
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    };

    if (reduceMotion) {
      // Un único frame estático, sin animación.
      program.uniforms.uTime.value = 2.0;
      renderer.render({ scene: mesh });
    } else {
      raf = requestAnimationFrame(render);
    }

    // Pausa el loop cuando la pestaña no está visible (ahorra batería/GPU).
    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-0"
    />
  );
}
