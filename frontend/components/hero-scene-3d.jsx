"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 9);
    camera.lookAt(2.2, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const keyLight = new THREE.PointLight(0xf97316, 1.2);
    keyLight.position.set(8, 6, 6);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xef4444, 0.6);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const group = new THREE.Group();
    group.position.set(2.2, 0, 0);
    scene.add(group);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xef4444,
        emissiveIntensity: 0.35,
        metalness: 0.45,
        roughness: 0.15,
      })
    );
    group.add(core);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.04, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.45 })
    );
    group.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.03, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35 })
    );
    innerRing.rotation.x = Math.PI / 3;
    group.add(innerRing);

    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0xf97316,
      emissiveIntensity: 0.25,
    });

    const coins = [
      { pos: [-2.8, 1.4, 0.6], scale: 0.85, speed: 0.6 },
      { pos: [3.2, -1.2, 0.4], scale: 0.7, speed: 0.45 },
      { pos: [-1.5, -2, -0.8], scale: 0.55, speed: 0.55 },
      { pos: [2.5, 2.2, -0.5], scale: 0.6, speed: 0.5 },
    ].map(({ pos, scale, speed }) => {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.1, 32),
        coinMaterial
      );
      coin.position.set(...pos);
      coin.scale.setScalar(scale);
      coin.rotation.x = Math.PI / 2;
      coin.userData.speed = speed;
      group.add(coin);
      return coin;
    });

    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      ),
      new THREE.PointsMaterial({
        size: 0.045,
        color: 0xfdba74,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(particles);

    const mouse = { x: 0, y: 0 };
    const onMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      core.rotation.y = t * 0.15;
      core.position.y = Math.sin(t * 1.8) * 0.12;
      outerRing.rotation.x = t * 0.18;
      outerRing.rotation.z = t * 0.12;
      innerRing.rotation.y = -t * 0.22;
      innerRing.rotation.x = Math.PI / 3 + t * 0.1;
      particles.rotation.y = t * 0.03;

      coins.forEach((coin, i) => {
        coin.rotation.y = t * coin.userData.speed;
        coin.position.y += Math.sin(t * 1.6 + i) * 0.0008;
      });

      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.35 + 0.5 - camera.position.y) * 0.04;
      camera.lookAt(2.2, 0, 0);

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
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      core.geometry.dispose();
      core.material.dispose();
      outerRing.geometry.dispose();
      outerRing.material.dispose();
      innerRing.geometry.dispose();
      innerRing.material.dispose();
      coinMaterial.dispose();
      coins.forEach((coin) => coin.geometry.dispose());
      particles.geometry.dispose();
      particles.material.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
