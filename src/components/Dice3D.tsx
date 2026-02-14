import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import type { DiceSkin } from '../utils/diceSkins';
import { getProceduralTexture } from '../utils/proceduralTextures';

// 15% size increase: base 2 -> 2.3
const DICE_SIZE = 2.3;
const HALF = DICE_SIZE / 2;
const FACE_OFFSET = HALF + 0.01;
const DOT_SPREAD = 0.345;   // 0.3 * 1.15
const DOT_RADIUS = 0.138;   // 0.12 * 1.15
const PLANE_SIZE = 2.07;    // 1.8 * 1.15
const IMG_PLANE_SIZE = 2.185; // 1.9 * 1.15

interface Dice3DProps {
  isRolling: boolean;
  onRollComplete: (result: number) => void;
  customFaceValues?: string[];
  customFaceImages?: string[];
  activeSkin?: DiceSkin;
}

const diceFaces = {
  1: [[0, 0, 0]],
  2: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  3: [[-DOT_SPREAD, DOT_SPREAD, 0], [0, 0, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  4: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  5: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [0, 0, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
  6: [[-DOT_SPREAD, DOT_SPREAD, 0], [DOT_SPREAD, DOT_SPREAD, 0], [-DOT_SPREAD, 0, 0], [DOT_SPREAD, 0, 0], [-DOT_SPREAD, -DOT_SPREAD, 0], [DOT_SPREAD, -DOT_SPREAD, 0]],
};

const faceRotations: { [key: number]: [number, number, number] } = {
  1: [0, 0, 0],
  2: [0, Math.PI, 0],
  3: [0, -Math.PI / 2, 0],
  4: [0, Math.PI / 2, 0],
  5: [Math.PI / 2, 0, 0],
  6: [-Math.PI / 2, 0, 0],
};

function DiceMesh({ isRolling, onRollComplete, customFaceValues, customFaceImages, activeSkin }: Dice3DProps) {
  const diceGroupRef = useRef<THREE.Group>(null);
  const rollTimeRef = useRef(0);
  const targetResultRef = useRef(1);
  const currentRotationRef = useRef<[number, number, number]>([0.4, 0.4, 0]);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const tumbleDirectionRef = useRef({ x: 1.3, y: 0.9, z: 0.4 });
  const tumbleSpeedRef = useRef(18);
  const isRollingRef = useRef(isRolling);
  const settleStartQuatRef = useRef(new THREE.Quaternion());
  const settleTargetQuatRef = useRef(new THREE.Quaternion());
  const texturesCacheRef = useRef<Map<string, THREE.DataTexture>>(new Map());
  const imageTexturesRef = useRef<Map<string, THREE.Texture>>(new Map());
  const [, forceUpdate] = useState({});

  const { gl } = useThree();

  const proceduralMap = useMemo(() => {
    if (!activeSkin?.material.textureType || activeSkin.material.textureType === 'none') return null;
    return getProceduralTexture(activeSkin.material.textureType, activeSkin.material.color);
  }, [activeSkin?.material.textureType, activeSkin?.material.color]);

  useEffect(() => {
    isRollingRef.current = isRolling;
    if (isRolling) {
      rollTimeRef.current = 0;
      targetResultRef.current = 0;
      velocityRef.current = { x: 0, y: 0 };

      tumbleDirectionRef.current = {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 2,
      };

      tumbleSpeedRef.current = 18 + Math.random() * 4;
    }
  }, [isRolling]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (_e: PointerEvent) => {
      if (!isRollingRef.current) {
        isDraggingRef.current = true;
        velocityRef.current = { x: 0, y: 0 };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current && !isRollingRef.current && diceGroupRef.current) {
        const rotationSpeed = 0.015;
        const deltaX = e.movementX * rotationSpeed;
        const deltaY = e.movementY * rotationSpeed;

        const quaternion = diceGroupRef.current.quaternion.clone();
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY);
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX);
        quaternion.premultiply(qX).premultiply(qY);
        diceGroupRef.current.quaternion.copy(quaternion);

        velocityRef.current = {
          x: e.movementY * 0.3,
          y: e.movementX * 0.3,
        };

        currentRotationRef.current = [
          diceGroupRef.current.rotation.x,
          diceGroupRef.current.rotation.y,
          diceGroupRef.current.rotation.z,
        ];
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [gl]);

  useEffect(() => {
    if (diceGroupRef.current && !isRollingRef.current) {
      texturesCacheRef.current.forEach(t => t.dispose());
      texturesCacheRef.current.clear();
      forceUpdate({});
    }
  }, [customFaceValues]);

  useEffect(() => {
    if (!customFaceImages || customFaceImages.length !== 6 || customFaceImages.some(img => !img)) {
      imageTexturesRef.current.forEach(t => t.dispose());
      imageTexturesRef.current.clear();
      forceUpdate({});
      return;
    }

    const loader = new THREE.TextureLoader();
    const newMap = new Map<string, THREE.Texture>();

    customFaceImages.forEach((dataUrl, i) => {
      const key = `img-${i}`;
      const existing = imageTexturesRef.current.get(key);
      if (existing && (existing as unknown as { _src?: string })._src === dataUrl) {
        newMap.set(key, existing);
        return;
      }
      const tex = loader.load(dataUrl, () => forceUpdate({}));
      tex.colorSpace = THREE.SRGBColorSpace;
      (tex as unknown as { _src?: string })._src = dataUrl;
      newMap.set(key, tex);
    });

    imageTexturesRef.current.forEach((tex, key) => {
      if (!newMap.has(key)) tex.dispose();
    });
    imageTexturesRef.current = newMap;
    forceUpdate({});
  }, [customFaceImages]);

  useEffect(() => {
    return () => {
      texturesCacheRef.current.forEach(t => t.dispose());
      texturesCacheRef.current.clear();
      imageTexturesRef.current.forEach(t => t.dispose());
      imageTexturesRef.current.clear();
    };
  }, []);

  const parseHexColor = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  };

  const createTextTexture = (text: string): THREE.DataTexture => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 0;
    }

    const drawPixel = (x: number, y: number, r: number, g: number, b: number, a: number = 255) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return;
      const index = (y * size + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
    };

    const [textR, textG, textB] = activeSkin ? parseHexColor(activeSkin.dotColor) : [220, 38, 38];

    const drawRect = (x: number, y: number, w: number, h: number) => {
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
          drawPixel(x + i, y + j, textR, textG, textB);
        }
      }
    };

    const textLength = Math.min(text.length, 6);
    let scale: number;
    if (textLength === 1) {
      scale = 9;
    } else if (textLength === 2) {
      scale = 7;
    } else if (textLength === 3) {
      scale = 5;
    } else if (textLength === 4) {
      scale = 4;
    } else {
      scale = 3;
    }

    const charWidth = 5;
    const charHeight = 7;
    const charSpacing = 1;

    const totalWidth = textLength * (charWidth * scale + charSpacing * scale) - charSpacing * scale;
    const startX = Math.floor((size - totalWidth) / 2);
    const startY = Math.floor((size - charHeight * scale) / 2);

    const fontPatterns: { [key: string]: number[][] } = {
      '0': [[0,1,1,1,0], [1,1,0,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,0,1,1], [0,1,1,1,0]],
      '1': [[0,0,1,0,0], [0,1,1,0,0], [1,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [1,1,1,1,1]],
      '2': [[0,1,1,1,0], [1,0,0,0,1], [0,0,0,0,1], [0,0,1,1,0], [0,1,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
      '3': [[0,1,1,1,0], [1,0,0,0,1], [0,0,0,0,1], [0,0,1,1,0], [0,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      '4': [[0,0,0,1,0], [0,0,1,1,0], [0,1,0,1,0], [1,0,0,1,0], [1,1,1,1,1], [0,0,0,1,0], [0,0,0,1,0]],
      '5': [[1,1,1,1,1], [1,0,0,0,0], [1,1,1,1,0], [0,0,0,0,1], [0,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      '6': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      '7': [[1,1,1,1,1], [0,0,0,0,1], [0,0,0,1,0], [0,0,1,0,0], [0,1,0,0,0], [0,1,0,0,0], [0,1,0,0,0]],
      '8': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      '9': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,1], [0,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      'A': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
      'B': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0]],
      'C': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,1], [0,1,1,1,0]],
      'D': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0]],
      'E': [[1,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
      'F': [[1,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0]],
      'G': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,0], [1,0,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,1]],
      'H': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
      'I': [[1,1,1,1,1], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [1,1,1,1,1]],
      'J': [[0,0,1,1,1], [0,0,0,1,0], [0,0,0,1,0], [0,0,0,1,0], [0,0,0,1,0], [1,0,0,1,0], [0,1,1,0,0]],
      'K': [[1,0,0,0,1], [1,0,0,1,0], [1,0,1,0,0], [1,1,0,0,0], [1,0,1,0,0], [1,0,0,1,0], [1,0,0,0,1]],
      'L': [[1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
      'M': [[1,0,0,0,1], [1,1,0,1,1], [1,0,1,0,1], [1,0,1,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
      'N': [[1,0,0,0,1], [1,1,0,0,1], [1,0,1,0,1], [1,0,1,0,1], [1,0,0,1,1], [1,0,0,0,1], [1,0,0,0,1]],
      'O': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      'P': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0]],
      'Q': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,0,0,1,0], [0,1,1,0,1]],
      'R': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0], [1,0,1,0,0], [1,0,0,1,0], [1,0,0,0,1]],
      'S': [[0,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [0,1,1,1,0], [0,0,0,0,1], [0,0,0,0,1], [1,1,1,1,0]],
      'T': [[1,1,1,1,1], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0]],
      'U': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
      'V': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0]],
      'W': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,0,1,0,1], [1,1,0,1,1], [1,0,0,0,1]],
      'X': [[1,0,0,0,1], [1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0], [0,1,0,1,0], [1,0,0,0,1], [1,0,0,0,1]],
      'Y': [[1,0,0,0,1], [1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0]],
      'Z': [[1,1,1,1,1], [0,0,0,0,1], [0,0,0,1,0], [0,0,1,0,0], [0,1,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
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
      case 0:
        dotPosition = [x, y, FACE_OFFSET];
        break;
      case 1:
        dotPosition = [-x, y, -FACE_OFFSET];
        rotation = [0, Math.PI, 0];
        break;
      case 2:
        dotPosition = [FACE_OFFSET, y, -x];
        rotation = [0, Math.PI / 2, 0];
        break;
      case 3:
        dotPosition = [-FACE_OFFSET, y, x];
        rotation = [0, -Math.PI / 2, 0];
        break;
      case 4:
        dotPosition = [x, FACE_OFFSET, -y];
        rotation = [-Math.PI / 2, 0, 0];
        break;
      case 5:
        dotPosition = [x, -FACE_OFFSET, y];
        rotation = [Math.PI / 2, 0, 0];
        break;
      default:
        dotPosition = [0, 0, 0];
    }

    return (
      <mesh key={`${faceIndex}-${x}-${y}`} position={dotPosition} rotation={rotation}>
        <circleGeometry args={[DOT_RADIUS, 32]} />
        <meshBasicMaterial color={activeSkin ? activeSkin.dotColor : '#DC2626'} side={THREE.DoubleSide} />
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

  const getTopFace = (rotation: THREE.Euler): number => {
    const cameraVector = new THREE.Vector3(0, 0, 1);

    const faceNormals = [
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
    ];

    let maxDot = -Infinity;
    let topFaceIndex = 0;

    faceNormals.forEach((normal, index) => {
      const rotatedNormal = normal.clone().applyEuler(rotation);
      const dotProduct = rotatedNormal.dot(cameraVector);

      if (dotProduct > maxDot) {
        maxDot = dotProduct;
        topFaceIndex = index;
      }
    });

    return topFaceIndex + 1;
  };

  useFrame((_state, delta) => {
    if (!diceGroupRef.current) return;

    if (isRollingRef.current) {
      rollTimeRef.current += delta;

      const tumblingDuration = 1.8;
      const settlingDuration = 1.4;
      const totalDuration = tumblingDuration + settlingDuration;

      if (rollTimeRef.current < tumblingDuration) {
        const tumbleProgress = rollTimeRef.current / tumblingDuration;
        const easeOut = 1 - Math.pow(1 - tumbleProgress, 2);

        const baseSpeed = tumbleSpeedRef.current;
        const currentSpeed = baseSpeed * (1 - easeOut * 0.85);

        diceGroupRef.current.rotation.x += currentSpeed * delta * tumbleDirectionRef.current.x;
        diceGroupRef.current.rotation.y += currentSpeed * delta * tumbleDirectionRef.current.y;
        diceGroupRef.current.rotation.z += currentSpeed * delta * tumbleDirectionRef.current.z;

      } else if (rollTimeRef.current < totalDuration) {
        if (targetResultRef.current === 0) {
          const currentTopFace = getTopFace(diceGroupRef.current.rotation);
          targetResultRef.current = currentTopFace;

          // Capture current orientation as SLERP start
          settleStartQuatRef.current.copy(diceGroupRef.current.quaternion);

          // Compute target quaternion from face rotation
          const target = faceRotations[targetResultRef.current];
          settleTargetQuatRef.current.setFromEuler(
            new THREE.Euler(target[0], target[1], target[2])
          );
        }

        const settleProgress = (rollTimeRef.current - tumblingDuration) / settlingDuration;
        // Cubic ease-out: starts with momentum, decelerates smoothly to zero
        const easedProgress = 1 - Math.pow(1 - settleProgress, 3);

        // Smooth SLERP from tumbling orientation to target face
        diceGroupRef.current.quaternion.slerpQuaternions(
          settleStartQuatRef.current,
          settleTargetQuatRef.current,
          easedProgress
        );

      } else {
        const target = faceRotations[targetResultRef.current];
        diceGroupRef.current.rotation.x = target[0];
        diceGroupRef.current.rotation.y = target[1];
        diceGroupRef.current.rotation.z = target[2];
        currentRotationRef.current = target;

        rollTimeRef.current = 0;
        isRollingRef.current = false;
        onRollComplete(targetResultRef.current);
        targetResultRef.current = 0;
      }
    } else if (!isDraggingRef.current) {
      const velocityThreshold = 0.001;

      if (Math.abs(velocityRef.current.x) > velocityThreshold || Math.abs(velocityRef.current.y) > velocityThreshold) {
        const rotationSpeed = 0.04;
        const dX = velocityRef.current.x * rotationSpeed;
        const dY = velocityRef.current.y * rotationSpeed;

        const quaternion = diceGroupRef.current.quaternion.clone();
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dX);
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dY);
        quaternion.premultiply(qX).premultiply(qY);
        diceGroupRef.current.quaternion.copy(quaternion);

        velocityRef.current.x *= 0.97;
        velocityRef.current.y *= 0.97;

        currentRotationRef.current = [
          diceGroupRef.current.rotation.x,
          diceGroupRef.current.rotation.y,
          diceGroupRef.current.rotation.z,
        ];
      } else {
        velocityRef.current = { x: 0, y: 0 };
      }
    }
  });

  const createImagePlane = (faceIndex: number) => {
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

    const tex = imageTexturesRef.current.get(`img-${faceIndex}`);
    if (!tex) return null;

    return (
      <mesh key={`img-${faceIndex}`} position={position} rotation={rotation}>
        <planeGeometry args={[IMG_PLANE_SIZE, IMG_PLANE_SIZE]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.01} side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const hasCustomValues = customFaceValues &&
                         customFaceValues.length === 6 &&
                         customFaceValues.every(val => val.trim() !== '');

  const hasCustomImages = customFaceImages &&
                          customFaceImages.length === 6 &&
                          customFaceImages.every(img => img !== '') &&
                          imageTexturesRef.current.size === 6;

  const mat = activeSkin?.material;

  return (
    <group ref={diceGroupRef} rotation={currentRotationRef.current}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} />
        <meshPhysicalMaterial
          color={mat?.color ?? '#FFFFFF'}
          roughness={mat?.roughness ?? 0.3}
          metalness={mat?.metalness ?? 0.3}
          envMapIntensity={2.0}
          clearcoat={mat?.clearcoat ?? 0}
          clearcoatRoughness={mat?.clearcoatRoughness ?? 0}
          transmission={mat?.transmission ?? 0}
          thickness={mat?.thickness ?? 0}
          ior={mat?.ior ?? 1.5}
          opacity={mat?.opacity ?? 1}
          transparent={mat?.transparent ?? false}
          emissive={mat?.emissive ?? '#000000'}
          emissiveIntensity={mat?.emissiveIntensity ?? 0}
          map={proceduralMap}
        />
      </mesh>

      {hasCustomImages ? (
        [0, 1, 2, 3, 4, 5].map(i => createImagePlane(i))
      ) : hasCustomValues ? (
        customFaceValues!.map((text, index) => createTextPlane(text, index))
      ) : (
        Object.entries(diceFaces).map(([, dots], faceIndex) =>
          dots.map((dot) => createDot(dot, faceIndex))
        )
      )}
    </group>
  );
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

function WebGLFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#a0a0b0',
      textAlign: 'center',
      padding: '20px',
    }}>
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</p>
      <p style={{ fontSize: '18px', marginBottom: '8px', color: '#DC2626' }}>
        3D Not Supported
      </p>
      <p style={{ fontSize: '14px' }}>
        Your device does not support WebGL, which is required for 3D graphics.
        Please update your Android System WebView or try a different device.
      </p>
    </div>
  );
}

export default function Dice3D(props: Dice3DProps) {
  const [webGLSupported] = useState(() => isWebGLAvailable());

  if (!webGLSupported) {
    return <WebGLFallback />;
  }

  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        shadows
      >
        <color attach="background" args={['#1a1a2e']} />
        <Environment preset="studio" />
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={2.0}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, -3, -3]} intensity={0.8} />
        <directionalLight position={[0, -3, 3]} intensity={1.0} />
        <directionalLight position={[-2, 4, -1]} intensity={0.6} />
        <DiceMesh {...props} />
      </Canvas>
    </ErrorBoundary>
  );
}
