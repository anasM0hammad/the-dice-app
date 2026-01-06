import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Dice3DProps {
  isRolling: boolean;
  onRollComplete: (result: number) => void;
  customFaceValues?: string[];
}

const diceFaces = {
  1: [[0, 0, 0]],
  2: [[-0.3, 0.3, 0], [0.3, -0.3, 0]],
  3: [[-0.3, 0.3, 0], [0, 0, 0], [0.3, -0.3, 0]],
  4: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
  5: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [0, 0, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
  6: [[-0.3, 0.3, 0], [0.3, 0.3, 0], [-0.3, 0, 0], [0.3, 0, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0]],
};

const faceRotations: { [key: number]: [number, number, number] } = {
  1: [0, 0, 0],
  2: [0, Math.PI, 0],
  3: [0, -Math.PI / 2, 0],
  4: [0, Math.PI / 2, 0],
  5: [Math.PI / 2, 0, 0],
  6: [-Math.PI / 2, 0, 0],
};

function DiceMesh({ isRolling, onRollComplete, customFaceValues }: Dice3DProps) {
  const diceGroupRef = useRef<THREE.Group>(null);
  const rollTimeRef = useRef(0);
  const targetResultRef = useRef(1);
  const currentRotationRef = useRef<[number, number, number]>([0.4, 0.4, 0]);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const tumbleDirectionRef = useRef({ x: 1.3, y: 0.9, z: 0.4 });
  const tumbleSpeedRef = useRef(18);
  const isRollingRef = useRef(isRolling);
  const [, forceUpdate] = useState({});
  
  const { camera, gl } = useThree();

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
    
    const handlePointerDown = (e: PointerEvent) => {
      if (!isRollingRef.current) {
        isDraggingRef.current = true;
        velocityRef.current = { x: 0, y: 0 };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current && !isRollingRef.current && diceGroupRef.current) {
        const rotationSpeed = 0.005;
        diceGroupRef.current.rotation.x += e.movementY * rotationSpeed;
        diceGroupRef.current.rotation.y += e.movementX * rotationSpeed;
        
        velocityRef.current = {
          x: e.movementY * 0.1,
          y: e.movementX * 0.1,
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
      forceUpdate({});
    }
  }, [customFaceValues]);

  const createTextTexture = (text: string): THREE.DataTexture => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    
    // Fill with transparent background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 0;   // A (transparent)
    }
    
    const drawPixel = (x: number, y: number, r: number, g: number, b: number, a: number = 255) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return;
      const index = (y * size + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
    };
    
    const drawRect = (x: number, y: number, w: number, h: number) => {
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
          drawPixel(x + i, y + j, 220, 38, 38); // Red color #DC2626
        }
      }
    };
    
    // Responsive scale based on text length
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
    
    // Character dimensions - 5x7 pixel font
    const charWidth = 5;
    const charHeight = 7;
    const charSpacing = 1;
    
    // Calculate total width and center the text
    const totalWidth = textLength * (charWidth * scale + charSpacing * scale) - charSpacing * scale;
    const startX = Math.floor((size - totalWidth) / 2);
    const startY = Math.floor((size - charHeight * scale) / 2);
    
    // 5x7 pixel font patterns
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
    
    // Render each character
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
        // For unknown characters, draw a simple box
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
        dotPosition = [x, y, 1.01];
        break;
      case 1:
        dotPosition = [-x, y, -1.01];
        rotation = [0, Math.PI, 0];
        break;
      case 2:
        dotPosition = [1.01, y, -x];
        rotation = [0, Math.PI / 2, 0];
        break;
      case 3:
        dotPosition = [-1.01, y, x];
        rotation = [0, -Math.PI / 2, 0];
        break;
      case 4:
        dotPosition = [x, 1.01, -y];
        rotation = [-Math.PI / 2, 0, 0];
        break;
      case 5:
        dotPosition = [x, -1.01, y];
        rotation = [Math.PI / 2, 0, 0];
        break;
      default:
        dotPosition = [0, 0, 0];
    }

    return (
      <mesh key={`${faceIndex}-${x}-${y}`} position={dotPosition} rotation={rotation}>
        <circleGeometry args={[0.12, 32]} />
        <meshBasicMaterial color="#DC2626" side={THREE.DoubleSide} />
      </mesh>
    );
  };

  const createTextPlane = (text: string, faceIndex: number) => {
    let position: [number, number, number];
    let rotation: [number, number, number] = [0, 0, 0];

    switch (faceIndex) {
      case 0:
        position = [0, 0, 1.01];
        break;
      case 1:
        position = [0, 0, -1.01];
        rotation = [0, Math.PI, 0];
        break;
      case 2:
        position = [1.01, 0, 0];
        rotation = [0, Math.PI / 2, 0];
        break;
      case 3:
        position = [-1.01, 0, 0];
        rotation = [0, -Math.PI / 2, 0];
        break;
      case 4:
        position = [0, 1.01, 0];
        rotation = [-Math.PI / 2, 0, 0];
        break;
      case 5:
        position = [0, -1.01, 0];
        rotation = [Math.PI / 2, 0, 0];
        break;
      default:
        position = [0, 0, 0];
    }

    const texture = createTextTexture(text);

    return (
      <mesh key={`text-${faceIndex}`} position={position} rotation={rotation}>
        <planeGeometry args={[1.8, 1.8]} />
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

  useFrame((state, delta) => {
    if (!diceGroupRef.current) return;

    if (isRollingRef.current) {
      rollTimeRef.current += delta;
      
      const tumblingDuration = 2.0;
      const settlingDuration = 1.0;
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
        }
        
        const settleProgress = (rollTimeRef.current - tumblingDuration) / settlingDuration;
        
        const tumbleProgress = 1.0;
        const easeOut = 1 - Math.pow(1 - tumbleProgress, 2);
        const baseSpeed = tumbleSpeedRef.current;
        const tumblingSpeed = baseSpeed * (1 - easeOut * 0.85);
        
        const currentSpeed = tumblingSpeed * (1 - settleProgress * 0.95);
        
        diceGroupRef.current.rotation.x += currentSpeed * delta * tumbleDirectionRef.current.x;
        diceGroupRef.current.rotation.y += currentSpeed * delta * tumbleDirectionRef.current.y;
        diceGroupRef.current.rotation.z += currentSpeed * delta * tumbleDirectionRef.current.z;
        
        const alignStrength = settleProgress * settleProgress;
        
        const target = faceRotations[targetResultRef.current];
        
        const normalizeAngle = (angle: number) => {
          while (angle > Math.PI) angle -= 2 * Math.PI;
          while (angle < -Math.PI) angle += 2 * Math.PI;
          return angle;
        };
        
        const deltaX = normalizeAngle(target[0] - diceGroupRef.current.rotation.x);
        const deltaY = normalizeAngle(target[1] - diceGroupRef.current.rotation.y);
        const deltaZ = normalizeAngle(target[2] - diceGroupRef.current.rotation.z);
        
        diceGroupRef.current.rotation.x += deltaX * alignStrength * delta * 3;
        diceGroupRef.current.rotation.y += deltaY * alignStrength * delta * 3;
        diceGroupRef.current.rotation.z += deltaZ * alignStrength * delta * 3;
        
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
        const rotationSpeed = 0.01;
        diceGroupRef.current.rotation.x += velocityRef.current.x * rotationSpeed;
        diceGroupRef.current.rotation.y += velocityRef.current.y * rotationSpeed;
        
        velocityRef.current.x *= 0.95;
        velocityRef.current.y *= 0.95;
        
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

  const hasCustomValues = customFaceValues && 
                         customFaceValues.length === 6 && 
                         customFaceValues.every(val => val.trim() !== '');

  return (
    <group ref={diceGroupRef} rotation={currentRotationRef.current}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={0xFFFFFF}
          roughness={0.3}
          metalness={0}
          envMapIntensity={0.5}
        />
      </mesh>
      
      {hasCustomValues ? (
        customFaceValues!.map((text, index) => createTextPlane(text, index))
      ) : (
        Object.entries(diceFaces).map(([faceNum, dots], faceIndex) => 
          dots.map((dot) => createDot(dot, faceIndex))
        )
      )}
    </group>
  );
}

export default function Dice3D(props: Dice3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      shadows
    >
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, -3, -3]} intensity={0.4} />
      <directionalLight position={[0, -3, 3]} intensity={0.3} />
      <DiceMesh {...props} />
    </Canvas>
  );
}

