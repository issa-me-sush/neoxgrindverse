import { useUser } from "@account-kit/react";

export function QuestsPanel() {
  return (
    <div className="space-y-4">
      {[
        {
          title: "Bridge to neoxverse",
          description: "Bridge minimum 0.05 GAS from any L2 to neoxverse Mainnet",
          reward: 100,
          difficulty: "Easy",
          participants: 156,
          link: "https://carrot-fi.xyz/bridge",
          requirements: "0.05 GAS"
        }
      ].map((quest, idx) => (
        <div key={idx} className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {quest.title}
            </h3>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              {quest.difficulty}
            </span>
          </div>
          
          <p className="text-gray-300 mb-6">{quest.description}</p>
          
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <span role="img" aria-label="bridge" className="text-xl">🌉</span>
              </div>
              <div>
                <div className="text-sm text-gray-400">Minimum Requirement</div>
                <div className="text-xl font-bold text-purple-400">
                  {quest.requirements}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span role="img" aria-label="users">👥</span>
              {quest.participants} participants
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-400">Reward</div>
                <div className="text-lg font-bold text-green-400">
                  {quest.reward} AURA
                </div>
              </div>
              <a 
                href={quest.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-white font-medium"
              >
                Bridge Now
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Coming Soon Section */}
      <div className="mt-8 p-4 bg-white/5 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">More Quests Coming Soon</h3>
        <p className="text-sm text-gray-500">
          Complete the bridge quest to unlock additional challenges
        </p>
      </div>
    </div>
  );
} 