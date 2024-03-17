WNS.vote was created during the ETHGlobal London 2024 hackathon. It is a quadratic voting app that uses ENS names for identifiability and World ID for Sybil resistance.

# Contracts

https://github.com/arr00/wns

Sepolia:

- ENS Registry: [0x2e7e59FCF7287b669A06B8F9eE7eec30BeD8feA3](https://sepolia.etherscan.io/address/0x2e7e59FCF7287b669A06B8F9eE7eec30BeD8feA3)
- Governance: [0x40E7aFaaCCC1C24CB197C93dbE24094d6822E41e](https://sepolia.etherscan.io/address/0x40E7aFaaCCC1C24CB197C93dbE24094d6822E41e)
- Token: [0xbb8f6b8df8cca184d54e58019cd8b71bdc26360e](https://sepolia.etherscan.io/address/0xbb8f6b8df8cca184d54e58019cd8b71bdc26360e)

# Overview

Quadratic voting aims to imbue on-chain governance with a slightly populist spirit, giving folks voting weight equivalent to the square root of their holdings.

This doesn't work without Sybil resistance, though. You need a way to stop whales from splitting their holdings up into many wallets.

This repo implements quadratic voting with World ID for Sybil resistance and ENS names for identifiability and, in the process, creating the first—to our knowledge—registry of ENS names that are verified to be unique humans.

# Presentation

https://tome.app/wns-vote/quadratic-voting-with-sybil-resistance-cltuda4ak00dqpk63kx3t7ug7

# Hosted version

https://wns-app.vercel.app/

# Run locally

```bash
yarn install
npm run start
```
