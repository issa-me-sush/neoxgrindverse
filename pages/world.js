import { useUser, useAuthModal } from "@account-kit/react";
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const WorldMap = dynamic(() => import('../components/WorldMap.jsx'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-2xl font-bold text-white">
        Loading Map...
      </div>
    </div>
  )
});

export default function WorldPage() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    if (!user) {
      openAuthModal();
    }
  }, [user, openAuthModal]);

  return (
    <div className="relative h-screen w-full bg-black">
      <WorldMap />
    </div>
  );
}