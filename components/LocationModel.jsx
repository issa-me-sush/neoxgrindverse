import { useRef, useState } from 'react';
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export const LocationModel = ({ modelPath = '/house.glb', ...props }) => {
  const ref = useRef(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  const { scene } = useGLTF(modelPath);
  const clonedScene = scene.clone();

  // Smooth rotation effect
  useFrame((_state, delta) => {
    if (ref.current) {
      // Rotate the model smoothly in a complete circle
      ref.current.rotation.y += delta * 0.2; // Adjust speed for desired effect
    }
  });

  return (
    <primitive
      object={clonedScene}
      ref={ref}
      scale={clicked ? 0.2 : 0.2}
      onClick={() => click(!clicked)}
    //   onPointerOver={() => hover(true)}
    //   onPointerOut={() => hover(false)}
      {...props}
    />
  );
};