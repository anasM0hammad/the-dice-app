import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function generateWoodTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('wood');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rand = seededRandom(42);

  // Base wood color
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, 0, size, size);

  // Draw wood grain rings
  const centerX = size * 0.3 + rand() * size * 0.4;
  const centerY = size * 0.3 + rand() * size * 0.4;

  for (let i = 0; i < 60; i++) {
    const radius = 15 + i * 8 + rand() * 6;
    const thickness = 1.5 + rand() * 2.5;
    const lightness = 25 + (i % 3) * 8 + rand() * 10;
    const saturation = 45 + rand() * 20;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * (0.6 + rand() * 0.4), rand() * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(25, ${saturation}%, ${lightness}%, ${0.15 + rand() * 0.2})`;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  // Fine grain lines along the wood
  for (let i = 0; i < 120; i++) {
    const y = rand() * size;
    const startX = rand() * size * 0.3;
    const endX = startX + size * 0.3 + rand() * size * 0.5;
    const waveAmplitude = 1 + rand() * 3;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    for (let x = startX; x < endX; x += 3) {
      const dy = Math.sin(x * 0.02 + rand() * 6) * waveAmplitude;
      ctx.lineTo(x, y + dy);
    }
    ctx.strokeStyle = `hsla(20, 50%, ${20 + rand() * 15}%, ${0.06 + rand() * 0.08})`;
    ctx.lineWidth = 0.5 + rand() * 1;
    ctx.stroke();
  }

  // Subtle knot spots
  for (let i = 0; i < 3; i++) {
    const kx = rand() * size;
    const ky = rand() * size;
    const kr = 5 + rand() * 12;
    const gradient = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
    gradient.addColorStop(0, `hsla(20, 60%, 18%, ${0.3 + rand() * 0.15})`);
    gradient.addColorStop(0.7, `hsla(25, 50%, 25%, ${0.1 + rand() * 0.1})`);
    gradient.addColorStop(1, 'hsla(25, 50%, 30%, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
  }

  // Varnish-like overlay for depth
  const varnish = ctx.createLinearGradient(0, 0, size, size);
  varnish.addColorStop(0, 'rgba(255, 220, 160, 0.08)');
  varnish.addColorStop(0.5, 'rgba(180, 120, 60, 0.05)');
  varnish.addColorStop(1, 'rgba(255, 200, 140, 0.06)');
  ctx.fillStyle = varnish;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('wood', texture);
  return texture;
}

export function generateLeatherTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('leather');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rand = seededRandom(123);

  // Base leather color
  ctx.fillStyle = '#6B3A2A';
  ctx.fillRect(0, 0, size, size);

  // Create pebbled/grain pattern
  for (let i = 0; i < 2000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 5;
    const lightness = 20 + rand() * 18;
    const alpha = 0.1 + rand() * 0.15;

    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.7 + rand() * 0.6), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(15, 55%, ${lightness}%, ${alpha})`;
    ctx.fill();
  }

  // Larger creases/wrinkles
  for (let i = 0; i < 20; i++) {
    const startX = rand() * size;
    const startY = rand() * size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let j = 0; j < 5; j++) {
      const cpx = startX + (rand() - 0.5) * 100;
      const cpy = startY + (rand() - 0.5) * 100;
      const ex = startX + (rand() - 0.5) * 150;
      const ey = startY + (rand() - 0.5) * 150;
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    }
    ctx.strokeStyle = `hsla(12, 50%, ${15 + rand() * 10}%, ${0.08 + rand() * 0.07})`;
    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.stroke();
  }

  // Stitching lines along edges
  for (let edge = 0; edge < 4; edge++) {
    const margin = 15 + rand() * 5;
    ctx.beginPath();
    if (edge === 0) { ctx.moveTo(margin, margin); ctx.lineTo(size - margin, margin); }
    else if (edge === 1) { ctx.moveTo(size - margin, margin); ctx.lineTo(size - margin, size - margin); }
    else if (edge === 2) { ctx.moveTo(size - margin, size - margin); ctx.lineTo(margin, size - margin); }
    else { ctx.moveTo(margin, size - margin); ctx.lineTo(margin, margin); }
    ctx.strokeStyle = `hsla(30, 40%, 45%, 0.15)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Subtle sheen gradient
  const sheen = ctx.createRadialGradient(size * 0.35, size * 0.35, 0, size * 0.5, size * 0.5, size * 0.7);
  sheen.addColorStop(0, 'rgba(255, 200, 160, 0.07)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.03)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('leather', texture);
  return texture;
}

export function generatePaperTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('paper');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rand = seededRandom(789);

  // Base paper color — warm cream
  ctx.fillStyle = '#d4b896';
  ctx.fillRect(0, 0, size, size);

  // Fine fiber noise
  for (let i = 0; i < 8000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const length = 2 + rand() * 8;
    const angle = rand() * Math.PI;
    const lightness = 60 + rand() * 25;
    const alpha = 0.04 + rand() * 0.06;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.strokeStyle = `hsla(30, 30%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 0.3 + rand() * 0.6;
    ctx.stroke();
  }

  // Subtle speckle spots
  for (let i = 0; i < 500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.5 + rand() * 1.5;
    const lightness = 40 + rand() * 30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(25, 20%, ${lightness}%, ${0.06 + rand() * 0.08})`;
    ctx.fill();
  }

  // Slight crumple/fold lines
  for (let i = 0; i < 6; i++) {
    const startX = rand() * size;
    const startY = rand() * size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const endX = startX + (rand() - 0.5) * size * 0.8;
    const endY = startY + (rand() - 0.5) * size * 0.8;
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsla(30, 20%, ${50 + rand() * 20}%, ${0.04 + rand() * 0.04})`;
    ctx.lineWidth = 0.5 + rand() * 1;
    ctx.stroke();
  }

  // Warm aged-paper gradient
  const aged = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.7);
  aged.addColorStop(0, 'rgba(255, 230, 190, 0.06)');
  aged.addColorStop(1, 'rgba(160, 120, 60, 0.05)');
  ctx.fillStyle = aged;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('paper', texture);
  return texture;
}

export function generateBrushedMetalTexture(baseColor: string = '#c9952e'): THREE.CanvasTexture {
  const cacheKey = `brushed-${baseColor}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rand = seededRandom(456);

  // Base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Horizontal brushed streaks
  for (let i = 0; i < 600; i++) {
    const y = rand() * size;
    const startX = rand() * size * 0.2;
    const width = size * 0.3 + rand() * size * 0.7;
    const lightness = 45 + rand() * 35;
    const alpha = 0.03 + rand() * 0.05;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + width, y + (rand() - 0.5) * 2);
    ctx.strokeStyle = `hsla(42, 70%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 0.3 + rand() * 0.8;
    ctx.stroke();
  }

  // Bright highlight streaks
  for (let i = 0; i < 40; i++) {
    const y = rand() * size;
    const startX = rand() * size * 0.1;
    const width = size * 0.5 + rand() * size * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + width, y + (rand() - 0.5) * 1);
    ctx.strokeStyle = `hsla(45, 80%, ${70 + rand() * 20}%, ${0.04 + rand() * 0.04})`;
    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.stroke();
  }

  // Specular highlight spot
  const spec = ctx.createRadialGradient(size * 0.35, size * 0.4, 0, size * 0.4, size * 0.45, size * 0.5);
  spec.addColorStop(0, 'rgba(255, 240, 180, 0.12)');
  spec.addColorStop(0.5, 'rgba(255, 220, 140, 0.04)');
  spec.addColorStop(1, 'rgba(200, 160, 60, 0)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function getProceduralTexture(textureType: string, baseColor?: string): THREE.CanvasTexture | null {
  switch (textureType) {
    case 'wood': return generateWoodTexture();
    case 'leather': return generateLeatherTexture();
    case 'paper': return generatePaperTexture();
    case 'brushed-metal': return generateBrushedMetalTexture(baseColor);
    default: return null;
  }
}
