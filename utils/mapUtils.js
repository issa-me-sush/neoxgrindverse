import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import { Canvas } from "@react-three/fiber";
import { LocationModel } from '../components/LocationModel';

export const determineZone = (types = []) => {
  if (types.includes('park')) {
    return {
      type: 'Nature Zone',
      icon: '🌳',
      bonus: 'Environmental Harmony',
      quests: ['Trail Blazer', 'Wildlife Observer']
    };
  }
  if (types.includes('museum') || types.includes('art_gallery')) {
    return {
      type: 'Cultural Zone',
      icon: '🏛️',
      bonus: 'Cultural Heritage',
      quests: ['Art Explorer', 'Culture Seeker']
    };
  }
  if (types.includes('restaurant') || types.includes('cafe')) {
    return {
      type: 'Social Zone',
      icon: '🍽️',
      bonus: 'Social Harmony',
      quests: ['Food Critic', 'Social Butterfly']
    };
  }
  return {
    type: 'Discovery Zone',
    icon: '🌟',
    bonus: 'Explorer\'s Luck',
    quests: ['Pioneer', 'Trailblazer']
  };
};

export const createLocationMarker = (location, map) => {
  const el = document.createElement('div');
  el.style.width = '50px';
  el.style.height = '50px';
  
  // Create a container for the Three.js scene
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  el.appendChild(container);

  // Create and render the Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(50, 50);
  container.appendChild(renderer.domElement);

  // Add lighting
  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(10, 10, 10);
  scene.add(light);
  
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  camera.position.z = 5;

  // Create marker element
  const marker = new mapboxgl.Marker({
    element: el,
    anchor: 'center'
  })
  .setLngLat(location.coordinates)
  .addTo(map);

  return marker;
};

export const add3DBuildings = (map, labelLayerId) => {
  map.addLayer(
    {
      id: 'add-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          0, 'rgba(30, 30, 35, 0.5)',
          50, 'rgba(40, 40, 45, 0.6)',
          100, 'rgba(50, 50, 55, 0.7)',
          200, 'rgba(60, 60, 65, 0.8)'
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.7,
        'fill-extrusion-vertical-gradient': true
      }
    },
    labelLayerId
  );
};

export const addSkyLayer = (map) => {
  map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 90.0],
      'sky-atmosphere-sun-intensity': 15
    }
  });
}; 