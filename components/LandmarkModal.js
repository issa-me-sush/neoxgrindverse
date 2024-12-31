import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import Image from 'next/image';
import { EVOLUTION_LEVELS, ZONE_TYPES } from '../utils/placeEvolution';
import { useUser , useAuthModal } from "@account-kit/react";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../contracts/abi';
// import { useAuthModal } from '../hooks/useAuthModal';
import { OverviewPanel } from './tabs/OverviewPanel';
import { QuestsPanel } from './tabs/QuestsPanel';
import { TreasuresPanel } from './tabs/TreasuresPanel';
import { EventsPanel } from './tabs/EventsPanel';
import { CommunityPanel } from './tabs/CommunityPanel';

// Add this helper function at the top of the file, before the component
const formatTimeRemaining = (nextClaimTime) => {
  if (!nextClaimTime) {
    return 'Available Now';
  }

  const now = Date.now();
  const timeLeft = nextClaimTime - now;
  
  console.log('Time formatting:', {
    nextClaimTime,
    now,
    timeLeft,
    nextClaimDate: new Date(nextClaimTime).toISOString()
  });
  
  if (timeLeft <= 0) return 'Available Now';

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Add network configuration at the top
const NEOX_NETWORK = {
  chainId: '0xBA9304', 
  chainName: 'Neox testnet',
  nativeCurrency: {
    name: 'GAS',
    symbol: 'GAS',
    decimals: 18
  },
  rpcUrls: ['https://neoxt4seed1.ngd.network'],
  blockExplorerUrls: ['https://xt4scan.ngd.network']
};

// Add network switching function
const switchToNeoxNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NEOX_NETWORK.chainId }],
    });
    console.log('Switched to neox Network successfully');
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NEOX_NETWORK],
        });
        console.log('neox Network added to wallet');
      } catch (addError) {
        console.error('Failed to add neox Network:', addError);
        throw new Error('Please add neox Network to your wallet manually');
      }
    } else {
      console.error('Failed to switch network:', switchError);
      throw switchError;
    }
  }
};

// Add this debug function at the top
const debugLog = (section, data) => {
  console.log(`[${section}]`, {
    timestamp: new Date().toISOString(),
    ...data
  });
};

export default function LandmarkModal({ landmark, onClose, onAuraClaimed }) {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  
  // Debug logs for initial render
  debugLog('MODAL_INIT', {
    landmark: {
      name: landmark?.name,
      place_id: landmark?.place_id,
      auraReward: landmark?.auraReward,
      full: landmark
    },
    user: {
      address: user?.address,
      full: user
    }
  });

  console.log("Landmark data received:", landmark); // Debug log
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [userStats, setUserStats] = useState({
    totalAuraEarned: 0,
    lastClaim: null,
    totalVisits: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState({
    canClaim: false,
    nextClaimTime: null
  });
  const [locationStats, setLocationStats] = useState({
    totalAura: 0,
    totalStaked: 0,
    visitorCount: 0
  });

  const photos = landmark.photos || [];
  const currentPhoto = photos[currentPhotoIndex]?.url;

  // Add logging to useEffect
  useEffect(() => {
    debugLog('USER_OR_LANDMARK_UPDATE', {
      user: user?.address,
      placeId: landmark?.place_id,
      hasUser: !!user,
      hasPlaceId: !!landmark?.place_id
    });
  }, [user, landmark]);

  // Fetch user stats for this location
  useEffect(() => {
    const fetchStats = async () => {
      if (!landmark?.place_id) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        // Fetch location stats
        const [totalAura, totalStaked, visitorCount] = await contract.getLocationStats(landmark.place_id);
        setLocationStats({
          totalAura: Number(ethers.utils.formatUnits(totalAura, 18)),
          totalStaked: Number(ethers.utils.formatUnits(totalStaked, 18)),
          visitorCount: visitorCount.toNumber()
        });

        // Fetch user stats if connected
        if (user?.address) {
          const [auraFarmed, stakeAmount, lastClaimTime, hasVisited] = await contract.getUserLocationStats(
            user.address,
            landmark.place_id
          );

          setUserStats({
            totalAuraEarned: Number(ethers.utils.formatUnits(auraFarmed, 18)),
            stakedAmount: Number(ethers.utils.formatUnits(stakeAmount, 18)),
            lastClaim: new Date(lastClaimTime.toNumber() * 1000),
            hasVisited
          });
        }
      } catch (error) {
        console.error('[FETCH_ERROR]', error);
      }
    };

    fetchStats();
  }, [user?.address, landmark?.place_id]);

  // Handle aura claim
  const handleClaim = async () => {
    debugLog('CLAIM_START', {
      user: user?.address,
      placeId: landmark?.place_id,
      timestamp: Date.now()
    });

    if (!user?.address || !landmark?.place_id) {
      debugLog('CLAIM_ERROR_MISSING_DATA', {
        hasUser: !!user,
        userAddress: user?.address,
        hasLandmark: !!landmark,
        placeId: landmark?.place_id
      });
      return;
    }
    
    setIsLoading(true);
    try {
      debugLog('NETWORK_SWITCH_START', {
        targetChain: NEOX_NETWORK.chainId,
        targetNetwork: NEOX_NETWORK.chainName
      });
      
      await switchToNeoxNetwork();
      
      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      debugLog('NETWORK_STATUS', {
        chainId: network.chainId,
        name: network.name,
        ensAddress: network.ensAddress,
        targetMatches: network.chainId === parseInt(NEOX_NETWORK.chainId, 16)
      });

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      debugLog('SIGNER_INFO', {
        address,
        matchesUser: address.toLowerCase() === user.address.toLowerCase()
      });

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      debugLog('CONTRACT_INIT', {
        address: CONTRACT_ADDRESS,
        hasClaimFunction: !!contract.claimAura,
        functions: Object.keys(contract.functions)
      });

      // Check if location is active
      const isActive = await contract.activeLocations(landmark.place_id);
      debugLog('LOCATION_CHECK', {
        placeId: landmark.place_id,
        isActive,
        landmarkName: landmark.name
      });

      // Check last claim time
      const lastClaimTime = await contract.lastClaim(address, landmark.place_id);
      const now = Date.now();
      const lastClaimDate = new Date(lastClaimTime.toNumber() * 1000);
      debugLog('CLAIM_TIME_CHECK', {
        lastClaimTime: lastClaimTime.toString(),
        lastClaimDate: lastClaimDate.toISOString(),
        timeSinceLastClaim: now - lastClaimDate.getTime(),
        canClaim: now - lastClaimDate.getTime() >= 24 * 60 * 60 * 1000
      });

      debugLog('SENDING_TRANSACTION', {
        userAddress: address,
        placeId: landmark.place_id,
        contractAddress: CONTRACT_ADDRESS
      });

      // Call the contract
      const tx = await contract.claimAura(landmark.place_id);
      debugLog('TRANSACTION_SENT', {
        hash: tx.hash,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit.toString(),
        data: tx.data
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      debugLog('TRANSACTION_CONFIRMED', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events.map(e => ({
          event: e.event,
          args: e.args,
          data: e.data
        })),
        logs: receipt.logs
      });

      if (receipt.status === 1) {
        const claimEvent = receipt.events?.find(e => e.event === 'AuraClaimed');
        const auraAmount = claimEvent 
          ? ethers.utils.formatUnits(claimEvent.args.amount, 18) 
          : '100';

        debugLog('CLAIM_SUCCESS', {
          amount: auraAmount,
          event: claimEvent,
          eventArgs: claimEvent?.args,
          rawAmount: claimEvent?.args?.amount?.toString()
        });

        // Update UI state
        setUserStats(prev => {
          const newStats = {
            ...prev,
            totalAuraEarned: prev.totalAuraEarned + Number(auraAmount),
            lastClaim: new Date()
          };
          debugLog('STATS_UPDATE', {
            previous: prev,
            new: newStats
          });
          return newStats;
        });

        setClaimStatus({
          canClaim: false,
          nextClaimTime: Date.now() + (24 * 60 * 60 * 1000)
        });

        // Update location stats
        try {
          await fetch('/api/locations/update-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              placeId: landmark.place_id,
              name: landmark.name,
              coordinates: landmark.coordinates,
              action: 'CLAIM',
              amount: Number(auraAmount),
              userAddress: user.address
            })
          });
        } catch (error) {
          console.error('Failed to update location stats:', error);
        }

        onAuraClaimed(Number(auraAmount));
      }
    } catch (error) {
      debugLog('CLAIM_ERROR', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
        stack: error.stack,
        errorObject: error
      });

      // More specific error handling
      if (error.code === 4902) {
        alert("Please add neox Network to your wallet");
      } else if (error.code === -32603) {
        debugLog('NETWORK_ERROR', {
          provider: window.ethereum?.isMetaMask,
          chainId: await window.ethereum?.request({ method: 'eth_chainId' })
        });
        alert("Network error. Please check your connection to neox Network");
      } else {
        const errorMessage = error.reason || error.message || "Unknown error";
        alert(`Failed to claim: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      debugLog('CLAIM_COMPLETE', {
        timestamp: Date.now()
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center px-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      <div 
        className="bg-black/90 rounded-xl w-full max-w-4xl border border-white/10 my-20 shadow-xl shadow-purple-500/10"
      >
        {/* Header */}
        <div className="relative h-48 sm:h-64">
        {currentPhoto ? (
          <Image
            src={currentPhoto}
            alt={landmark.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600" />
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{landmark.name}</h2>
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1 rounded-full bg-purple-500/20 backdrop-blur-sm text-purple-200 text-sm">
              Level {landmark.level || 1}
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-sm text-blue-200 text-sm">
              {landmark.visitors || 0} Visitors
            </div>
          </div>
        </div>
      </div>

        {/* Tabs - Make scrollable on mobile */}
        <Tab.Group onChange={setSelectedTab}>
          <Tab.List className="flex overflow-x-auto border-b border-white/10 hide-scrollbar">
            {[
              { name: 'Overview', icon: '🌟' },
              { name: 'Quests', icon: '⚔️' },
              { name: 'Treasures', icon: '🏰' },
              { name: 'Community', icon: '👥' },
              { name: 'Events', icon: '🎉' }
            ].map((tab, idx) => (
              <Tab
                key={tab.name}
                className={({ selected }) => `
                  flex items-center gap-2 px-6 py-4 focus:outline-none transition-colors
                  ${selected 
                    ? 'text-purple-400 border-b-2 border-purple-500 bg-white/5' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'}
                `}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            {/* Overview Panel */}
            <Tab.Panel>
              <OverviewPanel 
                landmark={landmark}
                user={user}
                userStats={userStats}
                locationStats={locationStats}
                claimStatus={claimStatus}
                isLoading={isLoading}
                handleClaim={handleClaim}
                openAuthModal={openAuthModal}
              />
            </Tab.Panel>

            {/* Quests Panel */}
            <Tab.Panel>
              <QuestsPanel />
            </Tab.Panel>

            {/* Treasures Panel */}
            <Tab.Panel>
              <TreasuresPanel landmark={landmark} />
            </Tab.Panel>
            <Tab.Panel>
              <CommunityPanel landmark={landmark} />
            </Tab.Panel>
            {/* Events Panel */}
            <Tab.Panel>
              <EventsPanel landmark={landmark} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 