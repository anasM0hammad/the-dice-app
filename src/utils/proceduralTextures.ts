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

// Simple 2D noise for natural texture variation
function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const hash = (a: number, b: number) => {
    let h = (a * 374761393 + b * 668265263 + seed * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) & 0x7fffffff) / 0x7fffffff;
  };
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
}

function fbmNoise(x: number, y: number, octaves: number, seed: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let totalAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 17) * amplitude;
    totalAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / totalAmp;
}

export function generateWoodTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('wood');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rand = seededRandom(42);

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

  // Fine grain lines
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

  // Knot spots
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

  // Varnish overlay
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

  // Base leather color
  ctx.fillStyle = '#6B3A2A';
  ctx.fillRect(0, 0, size, size);

  // Pixel-level grain using noise for realistic pebbled texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Multi-octave noise for organic pebble pattern
      const n1 = fbmNoise(x / 28, y / 28, 4, 100);
      const n2 = fbmNoise(x / 12, y / 12, 3, 200);
      const n3 = fbmNoise(x / 60, y / 60, 2, 300);
      // Combine: large-scale color variation + mid pebbles + fine grain
      const variation = (n1 - 0.5) * 40 + (n2 - 0.5) * 25 + (n3 - 0.5) * 15;
      pixels[idx] = Math.max(0, Math.min(255, pixels[idx] + variation));
      pixels[idx + 1] = Math.max(0, Math.min(255, pixels[idx + 1] + variation * 0.7));
      pixels[idx + 2] = Math.max(0, Math.min(255, pixels[idx + 2] + variation * 0.5));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const rand = seededRandom(123);

  // Deep crease lines for worn leather look
  for (let i = 0; i < 35; i++) {
    const startX = rand() * size;
    const startY = rand() * size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let cx = startX;
    let cy = startY;
    for (let j = 0; j < 8; j++) {
      cx += (rand() - 0.5) * 80;
      cy += (rand() - 0.5) * 80;
      ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = `hsla(12, 55%, ${12 + rand() * 10}%, ${0.10 + rand() * 0.10})`;
    ctx.lineWidth = 0.5 + rand() * 2;
    ctx.stroke();
  }

  // Stitching lines along edges
  for (let edge = 0; edge < 4; edge++) {
    const margin = 14;
    ctx.beginPath();
    if (edge === 0) { ctx.moveTo(margin, margin); ctx.lineTo(size - margin, margin); }
    else if (edge === 1) { ctx.moveTo(size - margin, margin); ctx.lineTo(size - margin, size - margin); }
    else if (edge === 2) { ctx.moveTo(size - margin, size - margin); ctx.lineTo(margin, size - margin); }
    else { ctx.moveTo(margin, size - margin); ctx.lineTo(margin, margin); }
    ctx.strokeStyle = 'hsla(35, 50%, 55%, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Subtle highlight sheen
  const sheen = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.7);
  sheen.addColorStop(0, 'rgba(255, 200, 160, 0.09)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.04)');
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

  // Speckle spots
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

  // Crumple/fold lines
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

  // Aged-paper gradient
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

  // Specular highlight
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

export function generateCrystalTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('crystal');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);

  // Base: deep translucent blue
  ctx.fillStyle = '#6a9ec8';
  ctx.fillRect(0, 0, size, size);

  // Per-pixel crystalline variation using noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Faceted look: sharp noise at multiple scales
      const n1 = valueNoise(x / 40, y / 40, 500);
      const n2 = valueNoise(x / 15, y / 15, 600);
      // Step function to create faceted edges
      const facet = Math.floor(n1 * 6) / 6;
      const fine = (n2 - 0.5) * 20;
      const variation = (facet - 0.5) * 50 + fine;

      pixels[idx] = Math.max(0, Math.min(255, pixels[idx] + variation * 0.4));
      pixels[idx + 1] = Math.max(0, Math.min(255, pixels[idx + 1] + variation * 0.6));
      pixels[idx + 2] = Math.max(0, Math.min(255, pixels[idx + 2] + variation));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const rand = seededRandom(555);

  // Prismatic light streaks (rainbow caustics)
  for (let i = 0; i < 15; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    const angle = rand() * Math.PI;
    const length = 80 + rand() * 200;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    const hue = rand() * 60 + 180; // blue-cyan range
    grad.addColorStop(0, `hsla(${hue}, 80%, 80%, 0)`);
    grad.addColorStop(0.3, `hsla(${hue}, 70%, 85%, ${0.08 + rand() * 0.06})`);
    grad.addColorStop(0.5, `hsla(${hue + 30}, 60%, 90%, ${0.10 + rand() * 0.05})`);
    grad.addColorStop(0.7, `hsla(${hue + 60}, 70%, 85%, ${0.08 + rand() * 0.06})`);
    grad.addColorStop(1, `hsla(${hue + 60}, 80%, 80%, 0)`);

    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.fillRect(0, -15, length, 30);
    ctx.restore();
  }

  // Sharp facet edges
  for (let i = 0; i < 25; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    const x2 = x1 + (rand() - 0.5) * 200;
    const y2 = y1 + (rand() - 0.5) * 200;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(210, 60%, 90%, ${0.06 + rand() * 0.08})`;
    ctx.lineWidth = 0.5 + rand() * 1;
    ctx.stroke();
  }

  // Bright specular highlights
  for (let i = 0; i < 5; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const r = 20 + rand() * 50;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `hsla(200, 80%, 95%, ${0.12 + rand() * 0.08})`);
    grad.addColorStop(0.5, `hsla(210, 60%, 85%, ${0.04 + rand() * 0.03})`);
    grad.addColorStop(1, 'hsla(210, 50%, 80%, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('crystal', texture);
  return texture;
}

export function generateGlassTexture(): THREE.CanvasTexture {
  const cached = textureCache.get('glass');
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = createCanvas(size);

  // Very light base — almost white with a hint of blue
  ctx.fillStyle = '#dae8f0';
  ctx.fillRect(0, 0, size, size);

  // Per-pixel subtle refraction-like distortion
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n = fbmNoise(x / 50, y / 50, 3, 700);
      const variation = (n - 0.5) * 18;
      pixels[idx] = Math.max(0, Math.min(255, pixels[idx] + variation));
      pixels[idx + 1] = Math.max(0, Math.min(255, pixels[idx + 1] + variation * 1.1));
      pixels[idx + 2] = Math.max(0, Math.min(255, pixels[idx + 2] + variation * 1.2));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const rand = seededRandom(777);

  // Faint smudges/fingerprints
  for (let i = 0; i < 8; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const r = 30 + rand() * 60;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
    grad.addColorStop(0, `hsla(210, 20%, 88%, ${0.04 + rand() * 0.03})`);
    grad.addColorStop(1, 'hsla(210, 10%, 90%, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * (0.6 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sharp light reflections (window-like caustics)
  for (let i = 0; i < 6; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    const angle = -0.3 + rand() * 0.6; // mostly horizontal
    const length = 100 + rand() * 250;
    const width = 3 + rand() * 8;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, 'hsla(0, 0%, 100%, 0)');
    grad.addColorStop(0.3, `hsla(0, 0%, 100%, ${0.06 + rand() * 0.05})`);
    grad.addColorStop(0.5, `hsla(0, 0%, 100%, ${0.10 + rand() * 0.05})`);
    grad.addColorStop(0.7, `hsla(0, 0%, 100%, ${0.06 + rand() * 0.05})`);
    grad.addColorStop(1, 'hsla(0, 0%, 100%, 0)');

    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.fillRect(0, -width / 2, length, width);
    ctx.restore();
  }

  // Edge highlight — beveled glass edge effect
  const edgeGrad = ctx.createLinearGradient(0, 0, size, size);
  edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  edgeGrad.addColorStop(0.5, 'rgba(200, 220, 240, 0.02)');
  edgeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('glass', texture);
  return texture;
}

export function getProceduralTexture(textureType: string, baseColor?: string): THREE.CanvasTexture | null {
  switch (textureType) {
    case 'wood': return generateWoodTexture();
    case 'leather': return generateLeatherTexture();
    case 'paper': return generatePaperTexture();
    case 'brushed-metal': return generateBrushedMetalTexture(baseColor);
    case 'crystal': return generateCrystalTexture();
    case 'glass': return generateGlassTexture();
    default: return null;
  }
}
