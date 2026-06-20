"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { formatMoney } from "@/lib/currency";

export function NetWorth3DChart({ data = [] }) {
  const containerRef = useRef(null);
  const labelsRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return undefined;

    const width = container.clientWidth;
    const height = 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const keyLight = new THREE.PointLight(0xf97316, 1.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(14, 14, 0xf97316, 0x334155);
    scene.add(grid);

    const maxVal = Math.max(...data.map((d) => d.netWorth), 1);
    const spacing = 1.4;
    const startX = -((data.length - 1) * spacing) / 2;

    const bars = data.map((point, index) => {
      const targetHeight = Math.max(0.3, (point.netWorth / maxVal) * 4);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1, 0.75),
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.2,
          metalness: 0.45,
          roughness: 0.3,
        })
      );
      mesh.position.x = startX + index * spacing;
      mesh.scale.y = 0.01;
      mesh.userData = { targetHeight, index };
      scene.add(mesh);
      return mesh;
    });

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      bars.forEach((bar) => {
        bar.scale.y += (bar.userData.targetHeight - bar.scale.y) * 0.06;
        bar.position.y = bar.scale.y / 2;
      });
      scene.rotation.y = Math.sin(t * 0.25) * 0.35;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Add accounts and transactions to see net worth over time.
      </p>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="w-full h-[280px] rounded-lg overflow-hidden" />
      <div
        ref={labelsRef}
        className="flex justify-between gap-1 mt-3 px-2 text-xs text-muted-foreground"
      >
        {data.map((d) => (
          <div key={d.monthKey} className="flex-1 text-center min-w-0">
            <p className="truncate font-medium text-foreground">{d.month.split(" ")[0]}</p>
            <p className="truncate">{formatMoney(d.netWorth)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
