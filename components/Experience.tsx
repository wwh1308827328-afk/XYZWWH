
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { AppMode, ParticleObject } from '../types';

interface ExperienceProps {
  mode: AppMode;
  handX: number;
  handY: number;
  onLoaded: () => void;
  onModeChange: (mode: AppMode) => void;
  onHandUpdate: (x: number, y: number) => void;
}

const Experience = forwardRef((props: ExperienceProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    composer: EffectComposer;
    mainGroup: THREE.Group;
    particles: ParticleObject[];
    handLandmarker: HandLandmarker | null;
    video: HTMLVideoElement | null;
    lastVideoTime: number;
    focusedIdx: number;
  } | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    addPhoto: (texture: THREE.Texture) => {
      if (engineRef.current) {
        addPhotoToScene(texture, engineRef.current);
      }
    }
  }));

  const addPhotoToScene = (texture: THREE.Texture, engine: any) => {
    // Cast texture.image to any to access width and height properties which are unknown in some TS configurations
    const img = texture.image as any;
    const aspect = img ? (img.width / img.height) : 1;
    // Frame
    const frameGeom = new THREE.BoxGeometry(2 * aspect + 0.2, 2.2, 0.15);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });
    const mesh = new THREE.Mesh(frameGeom, frameMat);
    
    // Photo surface
    const photoGeom = new THREE.PlaneGeometry(2 * aspect, 2);
    const photoMat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    const photoMesh = new THREE.Mesh(photoGeom, photoMat);
    photoMesh.position.z = 0.08;
    mesh.add(photoMesh);
    
    const p: ParticleObject = {
      mesh,
      type: 'PHOTO',
      originalPos: new THREE.Vector3().randomDirection().multiplyScalar(20),
      targetPos: new THREE.Vector3().randomDirection().multiplyScalar(15),
      targetRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      targetScale: new THREE.Vector3(1, 1, 1),
      velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.08),
      rotVelocity: new THREE.Vector3(Math.random() * 0.03, Math.random() * 0.03, Math.random() * 0.03)
    };
    
    engine.mainGroup.add(mesh);
    engine.particles.push(p);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.2;
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const orangePoint = new THREE.PointLight(0xffa500, 2, 100);
    orangePoint.position.set(0, 5, 0);
    scene.add(orangePoint);

    const goldSpot = new THREE.SpotLight(0xd4af37, 1200);
    goldSpot.position.set(30, 40, 40);
    goldSpot.angle = Math.PI / 6;
    goldSpot.penumbra = 0.2;
    scene.add(goldSpot);

    const blueSpot = new THREE.SpotLight(0x4444ff, 600);
    blueSpot.position.set(-30, 20, -30);
    scene.add(blueSpot);

    // --- POST PROCESSING ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.45, // strength
      0.4,  // radius
      0.7   // threshold
    );
    composer.addPass(bloomPass);

    // --- TEXTURES ---
    const createCandyTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 30;
      for (let i = -256; i < 512; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 256, 256);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    };
    const candyTexture = createCandyTexture();
    candyTexture.wrapS = THREE.RepeatWrapping;
    candyTexture.wrapT = THREE.RepeatWrapping;
    candyTexture.repeat.set(8, 1);

    // --- PARTICLES ---
    const particles: ParticleObject[] = [];
    const mainMats = [
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.1, metalness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x014421, roughness: 0.3, metalness: 0.2 })
    ];
    const redBallMat = new THREE.MeshPhysicalMaterial({ color: 0xbb0000, clearcoat: 1, clearcoatRoughness: 0.1, metalness: 0.5, roughness: 0.2 });
    const goldBallMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.1, clearcoat: 0.5 });

    const candyGeom = () => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(0.2, 1.5, 0),
        new THREE.Vector3(0.5, 1.6, 0),
        new THREE.Vector3(0.8, 1.4, 0),
      ]);
      return new THREE.TubeGeometry(curve, 32, 0.08, 12, false);
    };

    const addBatch = (count: number, type: 'MAIN' | 'DUST') => {
      for (let i = 0; i < count; i++) {
        let geom: THREE.BufferGeometry;
        let mat: THREE.Material;
        let scale = 1;

        if (type === 'MAIN') {
          const rand = Math.random();
          if (rand < 0.35) {
            geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            mat = mainMats[Math.floor(Math.random() * 2)];
          } else if (rand < 0.7) {
            geom = new THREE.SphereGeometry(0.3, 16, 16);
            mat = Math.random() > 0.4 ? redBallMat : goldBallMat;
          } else {
            geom = candyGeom();
            mat = new THREE.MeshStandardMaterial({ map: candyTexture });
          }
        } else {
          geom = new THREE.SphereGeometry(0.05, 8, 8);
          mat = new THREE.MeshStandardMaterial({ 
            color: 0xfceea7, 
            emissive: 0xfceea7, 
            emissiveIntensity: 1.5 + Math.random() * 2 
          });
          scale = 0.5 + Math.random() * 1.5;
        }

        const mesh = new THREE.Mesh(geom, mat);
        const p: ParticleObject = {
          mesh,
          type,
          originalPos: new THREE.Vector3().randomDirection().multiplyScalar(40),
          targetPos: new THREE.Vector3(),
          targetRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          targetScale: new THREE.Vector3(scale, scale, scale),
          velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05),
          rotVelocity: new THREE.Vector3(Math.random() * 0.04, Math.random() * 0.04, Math.random() * 0.04)
        };
        mainGroup.add(mesh);
        particles.push(p);
      }
    };

    addBatch(1500, 'MAIN');
    addBatch(2500, 'DUST');

    // Default Photo
    const createDefaultPhotoTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 15;
      ctx.strokeRect(30, 30, 452, 452);
      ctx.fillStyle = '#fceea7';
      ctx.font = 'bold 50px Cinzel';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText("JOYEUX NOËL", 256, 256);
      return new THREE.CanvasTexture(canvas);
    };
    
    const engineInstance = { renderer, scene, camera, composer, mainGroup, particles, handLandmarker: null, video: null, lastVideoTime: -1, focusedIdx: -1 };
    engineRef.current = engineInstance;
    addPhotoToScene(createDefaultPhotoTexture(), engineInstance);

    // --- MEDIAPIPE ---
    const setupCV = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        const video = document.getElementById("webcam") as HTMLVideoElement;
        const constraints = { video: { width: 160, height: 120 } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
          engineInstance.handLandmarker = handLandmarker;
          engineInstance.video = video;
          props.onLoaded();
        });
      } catch (err) {
        console.error("CV Setup Error:", err);
        props.onLoaded();
      }
    };
    setupCV();

    // --- ANIMATION LOOP ---
    let prevMode: AppMode = props.mode;
    const animate = () => {
      if (!engineRef.current) return;
      const engine = engineRef.current;
      const { composer, camera, particles, mainGroup, handLandmarker, video } = engine;

      // Detect Mode Change
      if (props.mode !== prevMode) {
        if (props.mode === AppMode.FOCUS) {
          const photoIndices = particles.map((p, i) => p.type === 'PHOTO' ? i : -1).filter(i => i !== -1);
          engine.focusedIdx = photoIndices[Math.floor(Math.random() * photoIndices.length)];
        }
        prevMode = props.mode;
      }

      // CV Inference
      if (handLandmarker && video && video.currentTime !== engine.lastVideoTime) {
        engine.lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, performance.now());
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const palm = landmarks[9];
          props.onHandUpdate((palm.x - 0.5) * 2, (palm.y - 0.5) * 2);

          const thumb = landmarks[4];
          const index = landmarks[8];
          const wrist = landmarks[0];
          const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
          
          const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
          const avgFingerDist = tips.reduce((acc, f) => acc + Math.hypot(f.x - wrist.x, f.y - wrist.y), 0) / 4;

          if (pinchDist < 0.06) {
            props.onModeChange(AppMode.FOCUS);
          } else if (avgFingerDist < 0.22) {
            props.onModeChange(AppMode.TREE);
          } else if (avgFingerDist > 0.38) {
            props.onModeChange(AppMode.SCATTER);
          }
        }
      }

      // Group Rotation
      mainGroup.rotation.y = THREE.MathUtils.lerp(mainGroup.rotation.y, props.handX * 0.6, 0.05);
      mainGroup.rotation.x = THREE.MathUtils.lerp(mainGroup.rotation.x, props.handY * 0.4, 0.05);

      const time = performance.now() * 0.001;

      particles.forEach((p, idx) => {
        if (props.mode === AppMode.TREE) {
          const t = idx / particles.length;
          const radius = 14 * (1 - t);
          const angle = t * 60 * Math.PI;
          p.targetPos.set(
            radius * Math.cos(angle),
            t * 32 - 16,
            radius * Math.sin(angle)
          );
          p.targetScale.setScalar(p.type === 'DUST' ? (1 + Math.sin(time * 2 + idx) * 0.5) : 1);
          p.targetRot.set(0, angle, 0);
        } else if (props.mode === AppMode.SCATTER) {
          p.targetPos.add(p.velocity);
          if (p.targetPos.length() > 30) p.targetPos.setLength(5 + Math.random() * 5);
          p.targetScale.setScalar(1);
          p.mesh.rotation.x += p.rotVelocity.x;
          p.mesh.rotation.y += p.rotVelocity.y;
        } else if (props.mode === AppMode.FOCUS) {
          if (idx === engine.focusedIdx) {
            p.targetPos.set(0, 2, 35);
            p.targetRot.set(0, 0, 0);
            p.targetScale.set(4.5, 4.5, 4.5);
          } else {
            const dir = p.mesh.position.clone().normalize();
            p.targetPos.copy(dir.multiplyScalar(45));
            p.targetScale.setScalar(0.3);
          }
        }

        p.mesh.position.lerp(p.targetPos, 0.06);
        p.mesh.scale.lerp(p.targetScale, 0.06);
        if (props.mode !== AppMode.SCATTER) {
          p.mesh.quaternion.slerp(new THREE.Quaternion().setFromEuler(p.targetRot), 0.06);
        }
      });

      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      engineRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full bg-black" />;
});

export default Experience;
