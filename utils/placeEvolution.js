// Define evolution levels and their requirements
export const EVOLUTION_LEVELS = {
  LEVEL_1: {
    name: 'Nascent Hotspot',
    minInteractions: 0,
    auraMultiplier: 1,
    color: '#3B82F6',
    benefits: ['Basic Aura Generation']
  },
  LEVEL_2: {
    name: 'Rising Nexus',
    minInteractions: 50,
    auraMultiplier: 1.5,
    color: '#8B5CF6',
    benefits: ['Enhanced Aura Generation', 'Daily Quests Unlocked']
  },
  LEVEL_3: {
    name: 'Power Node',
    minInteractions: 200,
    auraMultiplier: 2,
    color: '#EC4899',
    benefits: ['Premium Aura Generation', 'Special Events', 'Community Challenges']
  },
  LEVEL_4: {
    name: 'Legendary Beacon',
    minInteractions: 1000,
    auraMultiplier: 3,
    color: '#F59E0B',
    benefits: ['Maximum Aura Generation', 'Exclusive Rewards', 'Cross-Location Events']
  }
};

// Define zone types and their characteristics
export const ZONE_TYPES = {
  CULTURAL: {
    name: 'Cultural Zone',
    icon: '🏛️',
    bonusType: 'Historical Knowledge',
    specialQuests: ['Heritage Explorer', 'Art Collector']
  },
  NATURE: {
    name: 'Nature Zone',
    icon: '🌳',
    bonusType: 'Environmental Harmony',
    specialQuests: ['Trail Blazer', 'Wildlife Observer']
  },
  URBAN: {
    name: 'Urban Zone',
    icon: '🌆',
    bonusType: 'City Influence',
    specialQuests: ['Urban Explorer', 'Street Artist']
  },
  SOCIAL: {
    name: 'Social Hub',
    icon: '🤝',
    bonusType: 'Community Impact',
    specialQuests: ['Event Organizer', 'Network Builder']
  }
}; 