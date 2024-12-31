import { useAuthModal, useUser, useLogout } from "@account-kit/react";
import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const World = dynamic(() => import("../components/globe").then((m) => m.World), {
  ssr: false,
});
import { sampleArcs } from "../utils/constants";
export default function Home() {
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();
  const user = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const globeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
    preserveAspectRatio: true,
    width: 800,
    height: 800
  };
  const handleEnterWorld = () => {
    if (user) {
      router.push('/world');
    } else {
      // Handle authentication
      openAuthModal();
    }
  };

  return (
    <div className="bg-[#000102]">
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0a192f] to-black overflow-hidden">
    {/* Globe in the background */}
    <div className="fixed inset-0 z-0 pointer-events-auto flex items-center justify-center">
      <div className="relative aspect-square w-auto h-[80vh] max-w-[800px] flex-shrink-0">
        <World data={sampleArcs} globeConfig={{
          ...globeConfig,
          globeColor: "#0a192f",
          emissive: "#0f2847",
          atmosphereColor: "#ffffff",
          ambientLight: "#4a5568",
          polygonColor: "rgba(255,255,255,0.3)",
          preserveAspectRatio: true,
          responsiveWidth: true
        }} />
      </div>
    </div>
  
    {/* Animated background elements */}
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute -inset-[10px] bg-gradient-to-b from-transparent via-blue-900/5 to-transparent blur-3xl"></div>
    </div>
  
    {/* Main content */}
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pointer-events-none">
      <div className="absolute top-8 left-8">
        <img 
          src="/neoxlogo.svg" 
          alt="neoxverse" 
          className="w-36 h-106 filter invert"
          style={{ filter: 'brightness(1.2) hue-rotate(85deg) saturate(200%) drop-shadow(0 0 2px #39FF14)' }}
        />
      </div>
      <div className="text-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold">
          <span className="bg-gradient-to-r from-gray-100 via-blue-100 to-gray-200 bg-clip-text text-transparent">
            neoxverse
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light">
          Enter a world where digital and physical realities merge. Build, explore, and connect in ways never before possible.
        </p>
  
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
          {user ? (
            <>
              <div className="px-6 py-2 rounded-full bg-blue-950/30 backdrop-blur-sm border border-white/10">
                <span className="text-blue-200">Connected: </span>
                <span className="text-white/80">
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </span>
              </div>
              <button
                onClick={handleEnterWorld}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-gray-100 to-white hover:from-gray-200 hover:to-gray-100 text-[#0a192f] font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-white/25"
              >
                Enter World
              </button>
              <button
                onClick={logout}
                className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-gray-400"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleEnterWorld}
              className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-white text-[#0a192f]"
            >
              <span className="relative z-10">Connect to Enter</span>
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 blur"></div>
            </button>
          )}
        </div>
      </div>
    </div>
     
  </div>
  <div className="relative bg-transparent ">
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 py-16 ">
      {[
        {
          title: "Explore",
          description: "Discover digital landmarks and hidden treasures in the real world",
          icon: "🗺️"
        },
        {
          title: "Build",
          description: "Create and evolve your own digital structures",
          icon: "🏗️"
        },
        {
          title: "Connect",
          description: "Join forces with others to build something greater",
          icon: "🤝"
        }
      ].map((feature, index) => (
        <div 
          key={index}
          className="p-6 rounded-2xl border border-white/5 transform hover:scale-105 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.02]"
        >
          <div className="text-4xl mb-4">{feature.icon}</div>
          <h3 className="text-xl font-semibold mb-2 text-white/90">{feature.title}</h3>
          <p className="text-gray-400">{feature.description}</p>
        </div>
      ))}
    </div>
  </div>

</div>
  

  );
}