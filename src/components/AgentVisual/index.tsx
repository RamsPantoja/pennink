"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { getAgentAudioAnalyser } from "~/lib/agentAudio";
import { cn } from "~/lib/utils";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";

const vertexShader = /* glsl */ `
  uniform float u_time;
  uniform float u_frequency;
  varying float v_noise;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = mod289(floor(P));
    vec3 Pi1 = mod289(Pi0 + vec3(1.0));
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
  }

  void main() {
    float noise = cnoise(position * 1.4 + u_time * 0.16);
    float displacement = noise * (0.10 + u_frequency * 0.75);
    vec3 newPosition = position + normal * displacement;
    v_noise = noise * 0.5 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float u_frequency;
  varying float v_noise;

  void main() {
  vec3 quiet = vec3(0);
  vec3 loud = vec3(0.09);


    vec3 color = mix(quiet, loud, clamp(v_noise + u_frequency * 0.7, 0.0, 1.0));
    float brightness = 1.2 + u_frequency * 3.0 + v_noise * 0.8;
    gl_FragColor = vec4(color * brightness, 1.0);
  }
`;

export const AgentVisual = () => {
  const t = useTranslations("AgentVisual");
  const activity = useWorkspaceStore((state) => state.agentActivity);
  const canvasContainer = useRef<HTMLDivElement>(null);
  const activityRef = useRef(activity);
  activityRef.current = activity;

  useEffect(() => {
    const container = canvasContainer.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 5.8);
    camera.lookAt(scene.position);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_frequency: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      wireframe: true,
      transparent: true,
    });
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 5),
      material,
    );
    scene.add(mesh);

    const glow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.37, 3),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.08,
      }),
    );
    scene.add(glow);

    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.9,
      0.75,
      0.2,
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.35;
    bloomPass.radius = 0.85;
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const analyserData = new Uint8Array(128);
    const clock = new THREE.Clock();
    const mouse = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      mouse.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    container.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frame = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      const analyser = getAgentAudioAnalyser();
      let frequency = 0;
      if (analyser) {
        analyser.getByteFrequencyData(analyserData);
        frequency =
          analyserData.reduce((sum, value) => sum + value, 0) /
          analyserData.length /
          255;
      }

      const active = activityRef.current !== "idle";
      const speaking = activityRef.current === "speaking";
      const motion = reducedMotion.matches ? 0 : 1;
      const targetFrequency = speaking ? frequency : active ? 0.08 : 0;
      uniforms.u_frequency.value +=
        (targetFrequency - uniforms.u_frequency.value) * 0.16;
      uniforms.u_time.value = elapsed;
      mesh.rotation.y += (0.002 + uniforms.u_frequency.value * 0.012) * motion;
      mesh.rotation.x = Math.sin(elapsed * 0.4) * 0.08 * motion;
      glow.rotation.copy(mesh.rotation);
      glow.scale.setScalar(1 + uniforms.u_frequency.value * 0.25);
      camera.position.x +=
        (mouse.x * 0.28 - camera.position.x) * 0.025 * motion;
      camera.position.y +=
        (-mouse.y * 0.18 - camera.position.y) * 0.025 * motion;
      camera.lookAt(scene.position);

      composer.render();
      frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      composer.dispose();
      mesh.geometry.dispose();
      material.dispose();
      glow.geometry.dispose();
      glow.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  const isActive = activity !== "idle";
  const isSpeaking = activity === "speaking";

  return (
    <section
      aria-label={t("ariaLabel")}
      className={cn(
        "relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(0,0,0,.14),transparent_52%)]",
        isSpeaking && "agent-visual-speaking",
      )}
    >
      <div className="agent-visual-grid absolute inset-0 opacity-40" />
      <div
        ref={canvasContainer}
        className="relative z-10 h-full min-h-[360px] w-full"
      />
      <p className="absolute bottom-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        {isSpeaking
          ? "Listening to the voice"
          : isActive
            ? "Processing"
            : "Neural interface"}
      </p>
    </section>
  );
};
