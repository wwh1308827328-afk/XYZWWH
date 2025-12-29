
import * as THREE from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS'
}

export interface AppState {
  mode: AppMode;
  uiHidden: boolean;
  isLoading: boolean;
  focusedPhotoIndex: number | null;
  handX: number;
  handY: number;
}

export interface ParticleObject {
  mesh: THREE.Mesh;
  type: 'MAIN' | 'DUST' | 'PHOTO' | 'CANDY';
  originalPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  targetScale: THREE.Vector3;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
}
