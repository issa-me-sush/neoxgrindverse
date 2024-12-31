import { useUser } from "@account-kit/react";
import { formatTimeRemaining } from '../../lib/utils';

function canClaim(lastClaimTime) {
  if (!lastClaimTime) return true; // Never claimed before
  const now = Math.floor(Date.now() / 1000);
  const nextClaimTime = lastClaimTime + (24 * 3600); // 24 hours in seconds
  return now >= nextClaimTime;
}

function NFTLink({ tokenId }) {
  const explorerUrl = `https://xt4scan.ngd.network/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/instance/${tokenId}`;
  
  return (
    <a 
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all"
    >
      View NFT #{tokenId} on Explorer
    </a>
  );
}

export function OverviewPanel({ 
  landmark, 
  user, 
  userStats, 
  locationStats, 
  claimStatus, 
  isLoading, 
  handleClaim, 
  openAuthModal 
}) {
  return (
    <div className="space-y-6">
      {/* Location Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Aura Farmed</div>
          <div className="text-2xl font-bold text-purple-400">
            {locationStats.totalAura.toFixed(0)} AURA
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Staked</div>
          <div className="text-2xl font-bold text-blue-400">
            {locationStats.totalStaked.toFixed(0)} AURA
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Unique Visitors</div>
          <div className="text-2xl font-bold text-white">
            {locationStats.visitorCount}
          </div>
        </div>
      </div>

      {/* Personal Stats - Enhanced UI */}
      {user && (
        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Your Activity
            </h3>
            <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              Level {Math.floor(userStats?.totalAuraEarned / 100) || 0}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats cards */}
            <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <span role="img" aria-label="crystal" className="text-xl">💎</span>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Earned</div>
                  <div className="text-xl font-bold text-purple-400">
                    {userStats?.totalAuraEarned?.toFixed(2) || '0'} AURA
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Lifetime earnings from this location
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <span role="img" aria-label="clock" className="text-xl">⏰</span>
                </div>
                <div>
  <div className="text-sm text-gray-400">Last Claim</div>
  <div className="text-xl font-bold text-blue-400">
    {userStats?.lastClaim ? 
      new Date(userStats.lastClaim).toLocaleString('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      }) : 
      'Never'
    }
  </div>
</div>

              </div>
              <div className="mt-2 text-xs text-gray-500">
                Your last AURA claim at this location
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <span role="img" aria-label="footprints" className="text-xl">👣</span>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Visit Streak</div>
                  <div className="text-xl font-bold text-green-400">
                    {userStats?.totalVisits || 0} visits
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Your total visits to this location
              </div>
            </div>

            {userStats?.nftTokenId && (
              <div className="mt-4 text-center">
                <NFTLink tokenId={userStats.nftTokenId} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Section */}
      {user ? (
        <div className="bg-white/5 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-purple-400">Daily Aura Claim</h3>
            <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
              {landmark.auraReward} per day
            </div>
          </div>
          
          <div className="text-center">
            {canClaim(userStats?.lastClaim) ? (
              <button 
                onClick={handleClaim}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200"
              >
                Claim Daily AURA
              </button>
            ) : (
                <button 
                onClick={handleClaim}
                 className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200"
              >
                Claim Daily AURA
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-4">Connect your wallet to start earning Aura</p>
          <button
            onClick={() => openAuthModal()}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
} 