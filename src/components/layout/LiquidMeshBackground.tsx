/**
 * Output by Antigravity IDE
 * Ambient liquid mesh — breathe cycle synced with BrandLogo (AMBIENT_CYCLE_SEC).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AMBIENT_CYCLE_SEC } from '../../lib/ambientCycle'

const TWO_PI_OVER_CYCLE = (2.0 * Math.PI) / AMBIENT_CYCLE_SEC

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uDark;
uniform float uOmega;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.028;
  vec2 flow = vec2(
    fbm(uv * 2.6 + vec2(t * 0.42, -t * 0.38)),
    fbm(uv * 2.6 - vec2(t * 0.35, t * 0.41))
  );
  float n = fbm(uv * 3.2 + flow + t * 0.55);
  float breathe = sin(uTime * uOmega) * 0.5 + 0.5;
  float liquid = pow(clamp(n * (0.82 + 0.18 * breathe), 0.0, 1.0), 1.1);

  vec3 toxic = vec3(0.212, 1.0, 0.592);
  vec3 onyx = vec3(0.0, 0.02, 0.015);
  vec3 deepEmerald = vec3(0.0, 0.14, 0.09);
  float amb = sin(uTime * uOmega * 0.72) * 0.5 + 0.5;
  vec3 baseDark = mix(onyx, deepEmerald, amb * 0.42);

  /* Light = same lattice: snow base + depth tint (mirrors onyx↔deepEmerald), identical liquid + toxic highlights */
  vec3 snow = vec3(0.985, 0.992, 0.99);
  vec3 snowDepth = vec3(0.78, 0.91, 0.86);
  vec3 baseLite = mix(snow, snowDepth, amb * 0.42);

  vec3 colDark = mix(baseDark, toxic * 0.58, liquid * 0.97);
  colDark += toxic * pow(liquid, 2.55) * 0.88;
  colDark += toxic * pow(liquid, 5.2) * 0.1;

  /* Same lattice as dark — stronger toxic fill + highlights so liquid reads on snow */
  vec3 colLite = mix(baseLite, toxic * 0.52, liquid * 0.96);
  colLite += toxic * pow(liquid, 2.75) * 0.72;

  vec3 col = mix(colLite, colDark, uDark);
  gl_FragColor = vec4(col, 1.0);
}
`

function LiquidScene({ themeDark }: { themeDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { size, gl } = useThree()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(
            typeof window !== 'undefined' ? window.innerWidth : 1920,
            typeof window !== 'undefined' ? window.innerHeight : 1080
          ),
        },
        uDark: { value: themeDark ? 1 : 0 },
        uOmega: { value: TWO_PI_OVER_CYCLE },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable material; theme via uDark in useFrame
  }, [])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useFrame((state) => {
    const mat = meshRef.current?.material as THREE.ShaderMaterial | undefined
    if (!mat) return
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uResolution.value.set(size.width, size.height)
    mat.uniforms.uDark.value = themeDark ? 1 : 0
    mat.uniforms.uOmega.value = TWO_PI_OVER_CYCLE
  })

  useEffect(() => {
    gl.setClearColor(themeDark ? 0x000000 : 0xf5faf8, 1)
  }, [gl, themeDark])

  return (
    <mesh ref={meshRef} material={material} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

export function LiquidMeshBackground({ themeDark }: { themeDark: boolean }) {
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible'
  )

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 h-auto min-h-screen w-full overflow-visible bg-[#f5faf8] dark:bg-[#000000]"
      style={{ transform: 'translateZ(0)' }}
      aria-hidden
    >
      <Canvas
        className="absolute inset-0 block h-auto min-h-screen w-full"
        frameloop={tabVisible ? 'always' : 'never'}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: -1, far: 2 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.45)]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
      >
        <LiquidScene themeDark={themeDark} />
      </Canvas>
    </div>
  )
}
