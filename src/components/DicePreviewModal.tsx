import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import type { DiceSkin } from '../utils/diceSkins';
import { CloseIcon } from './icons';
import { getProceduralTexture } from '../utils/proceduralTextures';

// Match Dice3D sizing (15% increase)
const DICE_SIZE = 2.3;
const FACE_OFFSET = DICE_SIZE / 2 + 0.01;
const DOT_SPREAD = 0.345;
const DOT_RADIUS = 0.138;
const PLANE_SIZE = 2.07;

interface DicePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  skin: DiceSkin;
  customFaceValues?: string[];
}

const diceFaces: { [key: number]: number[][] } = {
  1: [[0, 0, 0]],
  2: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  3: [[-DOT_SPREAD, DOT_SPREAD, 0], [0, 0, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  4: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  5: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [0, 0, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  6: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [-DOT_SPREAD, 0, 0], [DOT_SPREAD, 0, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
};

function AutoRotatingDice({ skin, customFaceValues }: { skin: DiceSkin; customFaceValues?: string[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const texturesCacheRef = useRef<Map<string, THREE.DataTexture>>(new Map());

  const proceduralMap = useMemo(() => {
    if (!skin.material.textureType || skin.material.textureType === 'none') return null;
    return getProceduralTexture(skin.material.textureType, skin.material.color);
  }, [skin.material.textureType, skin.material.color]);

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
      case 0: dotPosition = [x, y, FACE_OFFSET]; break;
      case 1: dotPosition = [-x, y, -FACE_OFFSET]; rotation = [0, Math.PI, 0]; break;
      case 2: dotPosition = [FACE_OFFSET, y, -x]; rotation = [0, Math.PI / 2, 0]; break;
      case 3: dotPosition = [-FACE_OFFSET, y, x]; rotation = [0, -Math.PI / 2, 0]; break;
      case 4: dotPosition = [x, FACE_OFFSET, -y]; rotation = [-Math.PI / 2, 0, 0]; break;
      case 5: dotPosition = [x, -FACE_OFFSET, y]; rotation = [Math.PI / 2, 0, 0]; break;
      default: dotPosition = [0, 0, 0];
    }
    return (
      <mesh key={`${faceIndex}-${x}-${y}`} position={dotPosition} rotation={rotation}>
        <circleGeometry args={[DOT_RADIUS, 32]} />
        <meshBasicMaterial color={skin.dotColor} side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const createTextPlane = (text: string, faceIndex: number) => {
    let position: [number, number, number];
    let rotation: [number, number, number] = [0, 0, 0];
    switch (faceIndex) {
      case 0: position = [0, 0, FACE_OFFSET]; break;
      case 1: position = [0, 0, -FACE_OFFSET]; rotation = [0, Math.PI, 0]; break;
      case 2: position = [FACE_OFFSET, 0, 0]; rotation = [0, Math.PI / 2, 0]; break;
      case 3: position = [-FACE_OFFSET, 0, 0]; rotation = [0, -Math.PI / 2, 0]; break;
      case 4: position = [0, FACE_OFFSET, 0]; rotation = [-Math.PI / 2, 0, 0]; break;
      case 5: position = [0, -FACE_OFFSET, 0]; rotation = [Math.PI / 2, 0, 0]; break;
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
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const hasCustomValues = customFaceValues &&
    customFaceValues.length === 6 &&
    customFaceValues.every(val => val.trim() !== '');

  const mat = skin.material;

  return (
    <group ref={groupRef} rotation={[0.4, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} />
        <meshPhysicalMaterial
          color={mat.color}
          roughness={mat.roughness}
          metalness={mat.metalness}
          envMapIntensity={2.0}
          clearcoat={mat.clearcoat ?? 0}
          clearcoatRoughness={mat.clearcoatRoughness ?? 0}
          transmission={mat.transmission ?? 0}
          thickness={mat.thickness ?? 0}
          ior={mat.ior ?? 1.5}
          opacity={mat.opacity ?? 1}
          transparent={mat.transparent ?? false}
          emissive={mat.emissive ?? '#000000'}
          emissiveIntensity={mat.emissiveIntensity ?? 0}
          map={proceduralMap}
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
              <Environment preset="studio" />
              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 5, 5]} intensity={2.0} />
              <directionalLight position={[-3, -3, -3]} intensity={0.8} />
              <directionalLight position={[0, -3, 3]} intensity={1.0} />
              <directionalLight position={[-2, 4, -1]} intensity={0.6} />
              <AutoRotatingDice skin={skin} customFaceValues={customFaceValues} />
            </Canvas>
          </ErrorBoundary>
        </div>
        <p className="dice-preview-hint">Auto-rotating preview</p>
      </div>
    </div>
  );
}
