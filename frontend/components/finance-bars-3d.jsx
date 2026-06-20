"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const BAR_DATA = [
  { height: 1.2, x: -3.6, color: 0xef4444 },
  { height: 1.8, x: -2.4, color: 0xf97316 },
  { height: 2.4, x: -1.2, color: 0xfb923c },
  { height: 3.0, x: 0, color: 0xfbbf24 },
  { height: 2.6, x: 1.2, color: 0xfb923c },
  { height: 3.4, x: 2.4, color: 0xf97316 },
  { height: 4.0, x: 3.6, color: 0xef4444 },
];

export default function FinanceBars3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 8);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const keyLight = new THREE.PointLight(0xf97316, 1);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(12, 16, 0xf97316, 0x333333);
    scene.add(grid);

    const bars = BAR_DATA.map((bar, index) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1, 0.65),
        new THREE.MeshStandardMaterial({
          color: bar.color,
          emissive: bar.color,
          emissiveIntensity: 0.25,
          metalness: 0.5,
          roughness: 0.25,
        })
      );
      mesh.position.x = bar.x;
      mesh.scale.y = 0.01;
      mesh.userData = { targetHeight: bar.height, index };
      scene.add(mesh);
      return mesh;
    });

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf97316,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.1,
      })
    );
    gem.position.set(0, 4.8, 0);
    scene.add(gem);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      bars.forEach((bar) => {
        const wave =
          Math.sin(t * 1.2 + bar.userData.index * 0.6) * 0.15;
        const target = bar.userData.targetHeight + wave;
        bar.scale.y += (target - bar.scale.y) * 0.08;
        bar.position.y = bar.scale.y / 2;
      });

      gem.position.y = 4.8 + Math.sin(t * 1.2) * 0.15;
      gem.rotation.y = t * 0.8;
      scene.rotation.y = Math.sin(t * 0.25) * 0.12;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      grid.geometry.dispose();
      grid.material.dispose();
      bars.forEach((bar) => {
        bar.geometry.dispose();
        bar.material.dispose();
      });
      gem.geometry.dispose();
      gem.material.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
