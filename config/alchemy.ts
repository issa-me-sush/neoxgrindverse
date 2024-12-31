import { AlchemyAccountsUIConfig, createConfig } from "@account-kit/react";
import { sepolia, alchemy, createAlchemyPublicRpcClient } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { defineChain } from 'viem'
import { createPublicClient, http } from 'viem'

// First define the base NEO X chain
export const neoxTestnet = defineChain({
  id: 12227332,
  name: 'NeoX T4',
  network: 'neox-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GAS',
    symbol: 'GAS',
  },
  rpcUrls: {
    default: {
      http: ['https://neoxt4seed1.ngd.network'],
      webSocket: ['wss://neoxt4wss1.ngd.network'],
    },
    public: {
      http: ['https://neoxt4seed1.ngd.network'],
      webSocket: ['wss://neoxt4wss1.ngd.network'],
    },
    alchemy: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
    }
  },
  blockExplorers: {
    default: {
      name: 'NeoX T4 Explorer',
      url: 'https://xt4scan.ngd.network/',
    },
  },
  testnet: true
})

// Create Alchemy client
const alchemyClient = createAlchemyPublicRpcClient({
  chain: neoxTestnet,
  transport: alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
  })
})

// Create fallback client for NEO X
const neoxClient = createPublicClient({
  chain: neoxTestnet,
  transport: http(neoxTestnet.rpcUrls.default.http[0])
})

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" }
      ],
      [
        {
          type: "external_wallets",
          walletConnect: { projectId: "71c548caa10d661627b474b0f7bd4dd6" }
        }
      ]
    ],
    addPasskeyOnSignup: true,
  },
};

export const config = createConfig({
  transport: alchemy({ 
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
  }),
  chain: neoxTestnet,
  ssr: true,
  enablePopupOauth: true,
}, uiConfig);

export const queryClient = new QueryClient();