import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, useAuthModal, useLogout } from "@account-kit/react";
import { useRouter } from 'next/router';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LandmarkModal from './LandmarkModal';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../contracts/abi';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Threebox } from 'threebox-plugin';

// Set the token before any map operations
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Token exists' : 'No token found');

// Initial notable spots
const NOTABLE_SPOTS = [
  {
    name: 'Central Park',
    coordinates: [-73.968285, 40.785091],
    placeId: 'ChIJ4zGFAZpYwokRGUGph3Mf37k',
    type: 'park'
  },
  {
    name: 'Times Square',
    coordinates: [-73.9855, 40.7580],
    placeId: 'ChIJmQJIxlVYwokRLgeuocVOGVw',
    type: 'attraction'
  },
  {
    name: 'Metropolitan Museum of Art',
    coordinates: [-73.9632, 40.7794],
    placeId: 'ChIJb8Jg9pZYwokR-qHGtvSkLzs',
    type: 'museum'
  }
  // Add more notable spots here
];

// Add these constants at the top
const BOUNDARY_BUFFER = 0.5; // 50% buffer beyond visible bounds
const MIN_VISITORS_THRESHOLD = 10;
const FETCH_THRESHOLD = 0.75; // Refetch when user reaches 75% of buffer

const PLACE_TIERS = {
  LEGENDARY: {
    minAura: 100000,
    minZoom: 3,
    tag: '🌟 Legendary',
    color: '#FFD700',
    animation: {
      scale: [1, 1.2, 1],
      duration: 2000,
      glow: true
    }
  },
  EPIC: {
    minAura: 50000,
    minZoom: 5,
    tag: '✨ Epic',
    color: '#9B30FF',
    animation: {
      scale: [1, 1.15, 1],
      duration: 1800
    }
  },
  RARE: {
    minAura: 10000,
    minZoom: 8,
    tag: '💫 Rare',
    color: '#4169E1',
    animation: {
      scale: [1, 1.1, 1],
      duration: 1600
    }
  },
  UNCOMMON: {
    minAura: 1000,
    minZoom: 10,
    tag: '⭐ Uncommon',
    color: '#32CD32'
  },
  COMMON: {
    minAura: 0,
    minZoom: 12,
    tag: '🔮 Common',
    color: '#808080'
  }
};


export default function WorldMap() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [aura, setAura] = useState(0);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [loadedLocations, setLoadedLocations] = useState(new Set());

  // Define the spring animation outside JSX
  const spinAnimation = useSpring({
    from: { rotateZ: 0 },
    to: { rotateZ: 360 },
    loop: true,
    config: { duration: 10000 }
  });

  const fetchAuraBalance = async () => {
    if (!user?.address) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const balance = await contract.balanceOf(user.address, 0); // 0 is AURA token ID
      setAura(Number(ethers.utils.formatUnits(balance, 18)));
    } catch (error) {
      console.error('Error fetching AURA balance:', error);
    }
  };

  useEffect(() => {
    fetchAuraBalance();
  }, [user?.address]);

  const handleAuraClaimed = async (amount) => {
    await fetchAuraBalance(); // Fetch actual balance instead of just adding
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      console.log('Initializing map with token:', mapboxgl.accessToken);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-73.968285, 40.785091],
        zoom: 12,
        maxZoom: 20,
        minZoom: 3,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      map.current.on('style.load', () => {
        console.log('Map style loaded successfully');
        
        // Add 3D buildings
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;
        
        map.current.addLayer(
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
        
        // Add ambient light effect
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      });

      map.current.on('style.error', (e) => {
        console.error('Map style error:', e);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        
        map.current.resize();
        
        map.current.addControl(new mapboxgl.NavigationControl());

        // Wait for the style to load before adding markers
        map.current.on('style.load', () => {
          // Central Park marker
          const centralPark = {
            name: 'Central Park',
            coordinates: [-73.968285, 40.785091],
            hasEvents: true
          };
          
          // Create marker element
          const el = document.createElement('div');
          el.className = 'place-marker animate-float';
          
          el.innerHTML = `
            <div class="icon-container relative">
              <div class="icon-3d absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span style="font-size: 32px">🌳</span>
                <div class="sparkles"></div>
              </div>
              <div class="marker-tag absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div class="flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full">
                  <span class="text-white">Central Park</span>
                  <span class="text-xs text-purple-300">Active</span>
                </div>
              </div>
            </div>
          `;
          
          // Create and add the marker
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom' // This ensures the marker point is at the bottom center
          })
          .setLngLat(centralPark.coordinates)
          .addTo(map.current);

          console.log('Added Central Park marker at:', centralPark.coordinates);
        });

        map.current.on('click', ['poi-label', 'place-label'], async (e) => {
          if (!e.features?.length) return;

          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates.slice();
          const name = feature.properties.name;

          e.preventDefault();

          try {
            map.current.flyTo({
              center: coordinates,
              zoom: 17,
              pitch: 65,
              bearing: Math.random() * 180 - 90,
              duration: 2000,
              essential: true
            });

            const response = await fetch(`/api/places/search?query=${encodeURIComponent(name)}&location=${coordinates.join(',')}`);
            const placeData = await response.json();

            if (placeData) {
              setSelectedSpot({
                name,
                coordinates,
                ...placeData,
                action: 'view-landmark',
                level: 1,
                visitors: placeData.user_ratings_total || 0,
                auraReward: Math.floor((placeData.rating || 3) * 20),
                zone: determineZone(placeData.types)
              });
            }
          } catch (error) {
            console.error('Error fetching place details:', error);
          }
        });

        map.current.on('mouseenter', ['poi-label', 'place-label'], () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', ['poi-label', 'place-label'], () => {
          map.current.getCanvas().style.cursor = '';
        });

        // Add 3D floating icon layer
        map.current.addLayer({
          id: 'custom-threebox-model',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function () {
            // Create Three.js scene
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true });
            renderer.setSize(50, 50);
            
            // Create glowing sphere
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({
              color: 0x00ff00,
              emissive: 0x44aa44,
              transparent: true,
              opacity: 0.8
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
            
            // Add lights
            const light = new THREE.PointLight(0xffffff, 1, 100);
            light.position.set(10, 10, 10);
            scene.add(light);
            
            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);
            
            camera.position.z = 5;
            
            // Create marker element
            const el = document.createElement('div');
            el.appendChild(renderer.domElement);
            el.style.position = 'absolute';
            el.style.left = '-25px';
            el.style.top = '-25px';
            
            // Add marker to map
            new mapboxgl.Marker({
              element: el,
              anchor: 'center'
            })
            .setLngLat([-73.97250160574913, 40.77307297334758])
            .addTo(map.current);
            
            // Animation function
            function animate() {
              requestAnimationFrame(animate);
              sphere.rotation.x += 0.01;
              sphere.rotation.y += 0.01;
              renderer.render(scene, camera);
            }
            animate();
            
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;
          },
          render: function () {
            if (this.renderer) {
              this.renderer.render(this.scene, this.camera);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const determineZone = (types = []) => {
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

  const checkBoundaries = useCallback(() => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const center = map.current.getCenter();

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latBuffer = (ne.lat - sw.lat) * BOUNDARY_BUFFER;
    const lngBuffer = (ne.lng - sw.lng) * BOUNDARY_BUFFER;

    const bufferBounds = {
      north: ne.lat + latBuffer,
      south: sw.lat - latBuffer,
      east: ne.lng + lngBuffer,
      west: sw.lng - lngBuffer
    };

    const currentBounds = map.current.getBounds();
    const needsFetch = !mapBounds || 
      currentBounds.getNorth() > mapBounds.south + (mapBounds.north - mapBounds.south) * FETCH_THRESHOLD ||
      currentBounds.getSouth() < mapBounds.north - (mapBounds.north - mapBounds.south) * FETCH_THRESHOLD ||
      currentBounds.getEast() > mapBounds.west + (mapBounds.east - mapBounds.west) * FETCH_THRESHOLD ||
      currentBounds.getWest() < mapBounds.east - (mapBounds.east - mapBounds.west) * FETCH_THRESHOLD;

    if (needsFetch) {
      loadLocationData(bufferBounds);
      setMapBounds(bufferBounds);
    }
  }, [mapBounds]);

  const createAnimatedMarker = (location) => {
    console.log('Creating marker for:', location.place_id, location.name);
    
    const el = document.createElement('div');
    el.className = 'place-marker animate-float';
    
    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'icon-container';
    iconContainer.innerHTML = `
      <div class="icon-3d">
        <span style="font-size: 24px">
          ${location.hasEvents ? '🎉' : '🏠'}
        </span>
        ${location.hasEvents ? '<div class="sparkles"></div>' : ''}
      </div>
    `;
    el.appendChild(iconContainer);

    // Add name tag
    const tag = document.createElement('div');
    tag.className = 'marker-tag';
    tag.innerHTML = `
      <div class="flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full">
        <span>${location.name}</span>
      </div>
    `;
    el.appendChild(tag);

    return new mapboxgl.Marker({
      element: el,
      offset: [0, -30]
    })
    .setLngLat(location.coordinates)
    .addTo(map.current);
  };

  const loadLocationData = async (bounds) => {
    try {
      const response = await fetch('/api/locations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds })
      });

      const { locations } = await response.json();
      console.log('Found locations:', locations);

      // Create GeoJSON source
      const geojsonData = {
        type: 'FeatureCollection',
        features: locations.map(loc => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: loc.coordinates.coordinates
          },
          properties: {
            description: loc.name,
            icon: '🌱'
          }
        }))
      };

      // Add source and layer if they don't exist
      if (!map.current.getSource('places')) {
        map.current.addSource('places', {
          type: 'geojson',
          data: geojsonData
        });

        map.current.addLayer({
          id: 'poi-labels',
          type: 'symbol',
          source: 'places',
          layout: {
            'text-field': ['get', 'description'],
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-radial-offset': 0.5,
            'text-justify': 'auto',
            'icon-text': ['get', 'icon'],
            'icon-size': 1.5
          }
        });
      } else {
        // Update existing source
        map.current.getSource('places').setData(geojsonData);
      }

    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  useEffect(() => {
    if (!map.current) return;

    map.current.on('moveend', checkBoundaries);
    
    return () => {
      map.current?.off('moveend', checkBoundaries);
    };
  }, [checkBoundaries]);

  const handleConnect = () => {
    if (!user) {
      openAuthModal();
    }
  };

  const handleDisconnect = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="relative w-full h-[100dvh] bg-gray-100">
      {/* neoxverse Logo & Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 flex items-center gap-3 z-20"
      >
        <img 
          src="/neoxlogo.svg" 
          alt="neoxverse" 
          className="w-10 h-10 filter invert"
          style={{ filter: 'brightness(1.2) hue-rotate(85deg) saturate(200%) drop-shadow(0 0 2px #39FF14)' }}
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          neoxverse
        </h1>
      </motion.div>

      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
      />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
              Loading...
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 sm:right-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 z-10 max-w-3xl ml-auto">
        {user ? (
          <>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-2 sm:order-1 flex-1 h-14 px-6 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl shadow-black/10"
            >
              <div className="flex items-center h-full gap-3">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full ring-2 ring-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-2 ring-white/20 flex items-center justify-center">
                    <span className="text-white/70">🧙‍♂️</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">Explorer</span>
                  <span className="text-xs text-white/60">
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="order-1 sm:order-2 h-14 px-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 shadow-xl"
            >
              <div className="flex items-center h-full gap-3">
                <animated.div 
                  className="text-2xl"
                  style={{ 
                    transform: spinAnimation.rotateZ.to(val => `rotate(${val}deg)`)
                  }}
                >
                  ✨
                </animated.div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">Total Aura</span>
                  <span className="font-mono font-bold text-white">{aura.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            <button
              onClick={handleDisconnect}
              className="order-3 h-14 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all duration-200 hover:scale-105"
            >
              Disconnect
            </button>
          </>
        ) : (
          <motion.button
            onClick={handleConnect}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            className="h-14 px-8 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/20 text-white font-medium shadow-xl hover:shadow-white/10 transition-all duration-200"
          >
            Connect Wallet
          </motion.button>
        )}
      </div>

      {selectedSpot?.action === 'view-landmark' && (
        <div className="fixed inset-0 z-50 p-4 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center">
            <LandmarkModal 
              landmark={selectedSpot}
              onClose={() => setSelectedSpot(null)}
              onAuraClaimed={handleAuraClaimed}
            />
          </div>
        </div>
      )}
    </div>
  );
}