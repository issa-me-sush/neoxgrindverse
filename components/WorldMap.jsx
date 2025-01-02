import { useEffect, useRef, useState, Suspense } from 'react';
import { useUser, useAuthModal, useLogout } from "@account-kit/react";
import { useRouter } from 'next/router';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LandmarkModal from './LandmarkModal';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../contracts/abi';
import { INITIAL_VIEW_STATE } from '../constants/mapConstants';
import { determineZone } from '../utils/mapUtils';
import Map from 'react-map-gl';
import { Canvas, coordsToVector3 } from "react-three-map";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { OrbitControls } from '@react-three/drei';
import { Layer, Source } from 'react-map-gl';
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Preload the model
useGLTF.preload('/house.glb');

// Component for loading and rendering a GLB model
const Model = ({ modelPath = '/house.glb', ...props }) => {
  const ref = useRef(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  const { scene } = useGLTF(modelPath);
  console.log('Loading model:', modelPath);
  const clonedScene = scene.clone();

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <primitive
      object={clonedScene}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      {...props}
    />
  );
};

export default function WorldMap() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();
  const router = useRouter();
  const [aura, setAura] = useState(0);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([
    {
      name: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      hasEvents: true
    },
    {
      name: 'Metropolitan Museum of Art',
      latitude: 40.7794,
      longitude: -73.9632,
      hasEvents: true
    }
  ]);

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
      const balance = await contract.balanceOf(user.address, 0);
      setAura(Number(ethers.utils.formatUnits(balance, 18)));
    } catch (error) {
      console.error('Error fetching AURA balance:', error);
    }
  };

  useEffect(() => {
    fetchAuraBalance();
  }, [user?.address]);

  const handleAuraClaimed = async () => {
    await fetchAuraBalance();
  };

  const handleConnect = () => {
    if (!user) {
      openAuthModal();
    }
  };

  const handleDisconnect = async () => {
    await logout();
    router.push('/');
  };

  const onMapClick = async (event) => {
    const { features } = event;
    if (!features?.length) return;

    const feature = features[0];
    const coordinates = feature.geometry.coordinates.slice();
    const name = feature.properties.name;

    event.preventDefault();

    try {
      event.target.flyTo({
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
        const newLocation = {
          name,
          coordinates,
          ...placeData,
          action: 'view-landmark',
          level: 1,
          visitors: placeData.user_ratings_total || 0,
          auraReward: Math.floor((placeData.rating || 3) * 20),
          zone: determineZone(placeData.types)
        };

        setSelectedSpot(newLocation);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const loadLocationData = async (bounds) => {
    try {
      const response = await fetch('/api/locations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds })
      });

      const { locations: newLocations } = await response.json();
      console.log('Found locations from API:', newLocations);
      
      setLocations(prev => {
        // Convert new locations to the correct format
        const formattedNewLocations = newLocations
          .filter(loc => loc && loc.coordinates && loc.coordinates.coordinates)
          .map(loc => ({
            name: loc.name,
            placeId: loc.placeId,
            latitude: loc.coordinates.coordinates[1],
            longitude: loc.coordinates.coordinates[0],
            hasEvents: true
          }));

        console.log('Formatted new locations:', formattedNewLocations);

        // Combine existing and new locations, filtering out duplicates by placeId
        const allLocations = [...prev];
        formattedNewLocations.forEach(newLoc => {
          const existingIndex = allLocations.findIndex(
            existingLoc => existingLoc.placeId === newLoc.placeId
          );
          
          if (existingIndex === -1) {
            allLocations.push(newLoc);
          }
        });

        console.log('Final locations array:', allLocations);
        return allLocations;
      });
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-gray-100">
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

      <Map
        antialias
        initialViewState={{
          latitude: 40.7829,
          longitude: -73.9654,
          zoom: 14,
          pitch: 60,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={onMapClick}
        onMoveEnd={(evt) => {
          const bounds = evt.target.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          loadLocationData({
            north: ne.lat,
            south: sw.lat,
            east: ne.lng,
            west: sw.lng
          });
        }}
        interactiveLayerIds={['poi-label', 'place-label']}
        cursor="pointer"
      >
        <Layer
          id="add-3d-buildings"
          type="fill-extrusion"
          source="composite"
          source-layer="building"
          filter={['==', 'extrude', 'true']}
          minzoom={15}
          paint={{
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
              15, 0,
              15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-vertical-gradient': true
          }}
        />

        <Layer
          id="sky"
          type="sky"
          paint={{
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }}
        />

        <Canvas latitude={40.7829} longitude={-73.9654}>
          <hemisphereLight
            args={["#ffffff", "#60666C"]}
            position={[1, 4.5, 3]}
          />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
          />

          <Suspense fallback={null}>
            {locations.map((location, index) => {
              console.log('Rendering location:', location);
              const position = coordsToVector3(
                { 
                  latitude: location.latitude, 
                  longitude: location.longitude 
                },
                { 
                  latitude: 40.7829, 
                  longitude: -73.9654 
                }
              );
              console.log('Calculated position:', position, 'from:', location);

              return (
                <object3D key={location.placeId || index} position={position} scale={5}>
                  <Model 
                    modelPath="/butterlight.glb"
                    scale={6} 
                  />
                   <Model 
                    modelPath="/camp.glb"
                    scale={1} 
                  />
                </object3D>
              );
            })}
          </Suspense>
          {/* <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} /> */}
        </Canvas>
      </Map>
      
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