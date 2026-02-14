import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import type { DiceSkin } from '../utils/diceSkins';
import { CloseIcon } from './icons';

interface DicePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  skin: DiceSkin;
  customFaceValues?: string[];
}

const diceFaces: { [key: number]: number[][] } = {
  1: [[0, 0, 0]],
  2: [[-0.3, 0.3, 0], [0.3, -0.3, 0]],
  3: [[-0.3, 0.3, 0], [0, 0, 0], [0.3, -0.3, 0]],
  4: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
  5: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [0, 0, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
  6: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [-0.3, 0, 0], [0.3, 0, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
};

function AutoRotatingDice({ skin, customFaceValues }: { skin: DiceSkin; customFaceValues?: string[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const texturesCacheRef = useRef<Map<string, THREE.DataTexture>>(new Map());

  useEffect(() => {
    return () => {
      texturesCacheRef.current.forEach(t => t.dispose());
      texturesCacheRef.current.clear();
    };
  }, []);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.8;
      groupRef.current.rotation.x += delta * 0.3;
    }
  });

  const parseHexColor = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  };

  const createTextTexture = (text: string): THREE.DataTexture => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 0;
    }
    const [textR, textG, textB] = parseHexColor(skin.dotColor);
    const drawRect = (x: number, y: number, w: number, h: number) => {
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
          const px = x + i; const py = y + j;
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const index = (py * size + px) * 4;
            data[index] = textR; data[index + 1] = textG; data[index + 2] = textB; data[index + 3] = 255;
          }
        }
      }
    };
    const textLength = Math.min(text.length, 6);
    let scale: number;
    if (textLength === 1) scale = 9;
    else if (textLength === 2) scale = 7;
    else if (textLength === 3) scale = 5;
    else if (textLength === 4) scale = 4;
    else scale = 3;
    const charWidth = 5; const charHeight = 7; const charSpacing = 1;
    const totalWidth = textLength * (charWidth * scale + charSpacing * scale) - charSpacing * scale;
    const startX = Math.floor((size - totalWidth) / 2);
    const startY = Math.floor((size - charHeight * scale) / 2);

    const fontPatterns: { [key: string]: number[][] } = {
      '0': [[0,1,1,1,0],[1,1,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,0,1,1],[0,1,1,1,0]],
      '1': [[0,0,1,0,0],[0,1,1,0,0],[1,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
      '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
      '3': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
      '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
      '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
      '6': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
      '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
      '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
      '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
      'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
      'B': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
      'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
      'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
      'E': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
      'F': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
    };

    let offsetX = 0;
    for (let c = 0; c < textLength; c++) {
      const char = text[c].toUpperCase();
      const charStartX = startX + offsetX;
      const pattern = fontPatterns[char];
      if (pattern) {
        for (let row = 0; row < pattern.length; row++) {
          for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col]) {
              drawRect(charStartX + col * scale, startY + row * scale, scale, scale);
            }
          }
        }
      } else {
        drawRect(charStartX, startY + 2 * scale, 2 * scale, 3 * scale);
      }
      offsetX += (charWidth * scale) + (charSpacing * scale);
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.flipY = true;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  };

  const createDot = (position: number[], faceIndex: number) => {
    const [x, y] = position;
    let dotPosition: [number, number, number];
    let rotation: [number, number, number] = [0, 0, 0];
    switch (faceIndex) {
      case 0: dotPosition = [x, y, 1.01]; break;
      case 1: dotPosition = [-x, y, -1.01]; rotation = [0, Math.PI, 0]; break;
      case 2: dotPosition = [1.01, y, -x]; rotation = [0, Math.PI / 2, 0]; break;
      case 3: dotPosition = [-1.01, y, x]; rotation = [0, -Math.PI / 2, 0]; break;
      case 4: dotPosition = [x, 1.01, -y]; rotation = [-Math.PI / 2, 0, 0]; break;
      case 5: dotPosition = [x, -1.01, y]; rotation = [Math.PI / 2, 0, 0]; break;
      default: dotPosition = [0, 0, 0];
    }
    return (
      <mesh key={`${faceIndex}-${x}-${y}`} position={dotPosition} rotation={rotation}>
        <circleGeometry args={[0.12, 32]} />
        <meshBasicMaterial color={skin.dotColor} side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const createTextPlane = (text: string, faceIndex: number) => {
    let position: [number, number, number];
    let rotation: [number, number, number] = [0, 0, 0];
    switch (faceIndex) {
      case 0: position = [0, 0, 1.01]; break;
      case 1: position = [0, 0, -1.01]; rotation = [0, Math.PI, 0]; break;
      case 2: position = [1.01, 0, 0]; rotation = [0, Math.PI / 2, 0]; break;
      case 3: position = [-1.01, 0, 0]; rotation = [0, -Math.PI / 2, 0]; break;
      case 4: position = [0, 1.01, 0]; rotation = [-Math.PI / 2, 0, 0]; break;
      case 5: position = [0, -1.01, 0]; rotation = [Math.PI / 2, 0, 0]; break;
      default: position = [0, 0, 0];
    }
    const cacheKey = `${faceIndex}-${text}`;
    let texture = texturesCacheRef.current.get(cacheKey);
    if (!texture) {
      texture = createTextTexture(text);
      texturesCacheRef.current.set(cacheKey, texture);
    }
    return (
      <mesh key={`text-${faceIndex}`} position={position} rotation={rotation}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const hasCustomValues = customFaceValues &&
    customFaceValues.length === 6 &&
    customFaceValues.every(val => val.trim() !== '');

  return (
    <group ref={groupRef} rotation={[0.4, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial
          color={skin.material.color}
          roughness={skin.material.roughness}
          metalness={skin.material.metalness}
          envMapIntensity={0.5}
        />
      </mesh>
      {hasCustomValues
        ? customFaceValues!.map((text, index) => createTextPlane(text, index))
        : Object.entries(diceFaces).map(([, dots], faceIndex) =>
            dots.map((dot) => createDot(dot, faceIndex))
          )
      }
    </group>
  );
}

export default function DicePreviewModal({ visible, onClose, title, skin, customFaceValues }: DicePreviewModalProps) {
  if (!visible) return null;

  return (
    <div className="dice-preview-overlay" onClick={onClose}>
      <div className="dice-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="dice-preview-header">
          <h3 className="dice-preview-title">{title}</h3>
          <button className="dice-preview-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="dice-preview-canvas">
          <ErrorBoundary>
            <Canvas
              camera={{ position: [0, 0, 5.5], fov: 50 }}
              style={{ width: '100%', height: '100%', touchAction: 'none' }}
            >
              <color attach="background" args={['#1a1a2e']} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={2.5} />
              <directionalLight position={[-3, -3, -3]} intensity={0.7} />
              <directionalLight position={[0, -3, 3]} intensity={1} />
              <AutoRotatingDice skin={skin} customFaceValues={customFaceValues} />
            </Canvas>
          </ErrorBoundary>
        </div>
        <p className="dice-preview-hint">Auto-rotating preview</p>
      </div>
    </div>
  );
}
