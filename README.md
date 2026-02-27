# DRIP Protocol

<div align="center">

![DRIP Protocol Banner](https://img.shields.io/badge/DRIP-Bitcoin%20that%20flows-orange?style=for-the-badge)

**Real-time sBTC & STX streaming payments on Stacks**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Clarity](https://img.shields.io/badge/clarity-4.0-5546FF)](https://clarity-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Stacks](https://img.shields.io/badge/Stacks-Blockchain-5546FF)](https://www.stacks.co/)

[Features](#features) • [Getting Started](#getting-started) • [Architecture](#architecture) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🌊 Overview

**DRIP Protocol** is a cutting-edge streaming payments protocol that enables real-time, programmable Bitcoin and Stacks (STX) payments on the Stacks blockchain. Stream value continuously over time with trustless escrow, linear vesting, and instant withdrawals.

### Why DRIP?

- 💰 **Stream sBTC & STX** - Send payments that flow in real-time
- ⏱️ **Linear Vesting** - Funds unlock continuously, second by second
- 🔒 **Trustless Escrow** - Smart contracts hold funds securely
- ⚡ **Instant Withdrawals** - Recipients withdraw vested funds anytime
- 🎯 **Flexible Cancellation** - Senders can cancel and reclaim unvested funds
- 📊 **Real-time Monitoring** - Track all streams through an intuitive dashboard

---

## ✨ Features

### Core Functionality

- **Create Streams**: Set up streaming payments with custom amounts and durations
- **Withdraw Funds**: Recipients can claim vested funds at any time
- **Cancel Streams**: Senders can terminate active streams and retrieve unvested amounts
- **Dashboard Analytics**: Comprehensive view of active, completed, and cancelled streams
- **Transaction History**: Complete audit trail of all stream activities
- **Real-time Updates**: Live stream progress and balance calculations

### User Personas

| Persona | Use Case |
|---------|----------|
| **Employers** | Stream salaries to employees in real-time |
| **Investors** | Vest tokens to founders/teams over time |
| **Freelancers** | Receive continuous payment as work progresses |
| **DAOs** | Manage treasury disbursements programmatically |
| **Creators** | Receive ongoing support from patrons |

---

## 🏗️ Architecture

### Tech Stack

#### Smart Contracts
- **Clarity 4.0** - Secure, decidable smart contract language
- **Stacks Blockchain** - Bitcoin-secured layer for smart contracts
- **sBTC Integration** - Native Bitcoin asset streaming

#### Frontend
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.8** - Type-safe JavaScript
- **Vite 5.4** - Lightning-fast build tool
- **TanStack Query** - Powerful data synchronization
- **React Router 6** - Client-side routing
- **Framer Motion** - Smooth animations and transitions

#### UI Components
- **shadcn/ui** - Beautiful, accessible components
- **Radix UI** - Unstyled, accessible primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Consistent icon library

#### State Management
- **@stacks/connect** - Wallet connection and authentication
- **React Hook Form** - Performant form validation
- **Zod** - Schema validation

### Project Structure

```
drip-protocol/
├── contracts/              # Clarity smart contracts
│   ├── drip-core-testnet.clar   # Main protocol logic (testnet)
│   ├── drip-core-v2.clar        # Production version
│   └── sbtc-token.clar          # sBTC token interface
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── pages/         # Page components
│   └── public/            # Static assets
├── tests/                 # Contract tests
├── scripts/               # Deployment and testing scripts
└── deployments/           # Deployment configurations
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm/pnpm/bun
- **Clarinet** v2.0+ ([Install Clarinet](https://docs.hiro.so/clarinet/installation))
- **Stacks Wallet** ([Leather](https://leather.io/) or [Xverse](https://www.xverse.app/))
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gid-ctl/drip-protocol.git
   cd drip-protocol
   ```

2. **Install contract dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   # or
   bun install
   ```

### Running Locally

#### 1. Start Clarinet Console (Smart Contracts)

```bash
# From project root
clarinet console
```

Test contracts interactively:
```clarity
(contract-call? .drip-core create-stream 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 
  u1000000 
  u100)
```

#### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

#### 3. Connect Your Wallet

- Install a Stacks wallet browser extension
- Connect to the appropriate network (testnet/mainnet)
- Interact with the DRIP Protocol

---

## 🧪 Testing

### Smart Contract Tests

Run the comprehensive test suite:

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:report
```

### Testnet Integration Tests

```bash
# Basic testnet tests
npm run test:testnet

# Extensive testnet suite
npm run test:testnet:extensive

# Full integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend
npm test

# Watch mode
npm run test:watch
```

---

## 📝 Smart Contract API

### Core Functions

#### `create-stream`
Create a new sBTC streaming payment.

```clarity
(contract-call? .drip-core create-stream 
  recipient-principal 
  total-amount-sats 
  duration-blocks)
```

**Parameters:**
- `recipient`: Principal address receiving the stream
- `total-amount`: Amount in satoshis (1 BTC = 100,000,000 sats)
- `duration`: Stream duration in blocks (~10 min/block)

**Returns:** `(ok stream-id)`

---

#### `create-stx-stream`
Create a new STX streaming payment.

```clarity
(contract-call? .drip-core create-stx-stream 
  recipient-principal 
  total-amount-microstx 
  duration-blocks)
```

**Parameters:**
- `recipient`: Principal address receiving the stream
- `total-amount`: Amount in micro-STX (1 STX = 1,000,000 µSTX)
- `duration`: Stream duration in blocks

**Returns:** `(ok stream-id)`

---

#### `withdraw`
Withdraw vested sBTC from a stream.

```clarity
(contract-call? .drip-core withdraw stream-id)
```

**Parameters:**
- `stream-id`: Unique identifier of the stream

**Returns:** `(ok amount-withdrawn)`

---

#### `withdraw-stx`
Withdraw vested STX from a stream.

```clarity
(contract-call? .drip-core withdraw-stx stream-id)
```

---

#### `cancel-stream`
Cancel an active stream and retrieve unvested funds.

```clarity
(contract-call? .drip-core cancel-stream stream-id)
```

**Returns:** `(ok {withdrawn: uint, refunded: uint})`

---

### Read-Only Functions

#### `get-stream`
Retrieve complete stream details.

```clarity
(contract-call? .drip-core get-stream stream-id)
```

#### `get-vested-amount`
Calculate currently vested amount.

```clarity
(contract-call? .drip-core get-vested-amount stream-id)
```

#### `get-withdrawable-amount`
Calculate amount available for withdrawal.

```clarity
(contract-call? .drip-core get-withdrawable-amount stream-id)
```

---

## 🎨 Frontend Features

### Pages

- **Dashboard** - Overview of all streams with analytics
- **Create Stream** - Multi-step wizard for creating new streams
- **Stream Detail** - Detailed view of individual streams
- **History** - Complete transaction history
- **Settings** - User preferences and configuration

### Key Components

- **Stream Cards** - Visual representation of active streams
- **Stream Visualization** - Animated progress indicators
- **Transaction History** - Filterable activity log
- **Stats Cards** - Real-time protocol statistics
- **Network Badge** - Current network indicator
- **Theme Toggle** - Light/dark mode support

### Design Philosophy

The DRIP frontend embodies the elegance of flowing water while maintaining the security and trust associated with Bitcoin:

- **Fluid** - Everything flows, nothing is static
- **Transparent** - Users always know where their Bitcoin is
- **Secure** - Visual cues reinforce safety and trust
- **Premium** - Enterprise-grade polish
- **Accessible** - Works for everyone, everywhere

---

## 🌐 Deployment

### Smart Contracts

#### Testnet Deployment

```bash
# Configure testnet settings
clarinet deployments generate --testnet

# Deploy to testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

#### Mainnet Deployment

⚠️ **Important**: Thoroughly test on testnet before mainnet deployment.

```bash
# Generate mainnet deployment plan
clarinet deployments generate --mainnet

# Review and deploy
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

### Frontend Deployment

#### Build for Production

```bash
cd frontend
npm run build
```

The optimized build will be in `frontend/dist/`.

#### Deployment Platforms

- **Vercel**: Zero-config deployment
  ```bash
  vercel --prod
  ```

- **Netlify**: Drag-and-drop or CLI
  ```bash
  netlify deploy --prod --dir=dist
  ```

- **GitHub Pages**: Static hosting
  ```bash
  npm run build
  # Deploy contents of dist/ folder
  ```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Network Configuration
VITE_NETWORK=mainnet                    # or testnet
VITE_STACKS_API_URL=https://api.mainnet.hiro.so

# Contract Addresses
VITE_DRIP_CONTRACT_ADDRESS=SP1234...
VITE_DRIP_CONTRACT_NAME=drip-core-v2

# Optional
VITE_ENABLE_ANALYTICS=false
```

### Network Settings

Edit `settings/Testnet.toml` or `settings/Mainnet.toml` for blockchain configuration.

---

## 📚 Documentation

### Additional Resources

- [PRD-FRONTEND.md](PRD-FRONTEND.md) - Comprehensive frontend product requirements
- [Clarity Reference](https://docs.stacks.co/clarity) - Clarity language documentation
- [Stacks.js Docs](https://docs.hiro.so/stacks.js) - Stacks JavaScript library
- [shadcn/ui Docs](https://ui.shadcn.com/) - UI component documentation

### Code Examples

Check the `tests/` directory for comprehensive usage examples and integration patterns.

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   cd frontend && npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Coding Standards

- **Clarity**: Follow [Clarity best practices](https://docs.stacks.co/clarity/best-practices)
- **TypeScript**: Use strict type checking
- **React**: Follow [React best practices](https://react.dev/learn)
- **Testing**: Maintain >80% code coverage
- **Commits**: Use conventional commit messages

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Test coverage
- 🌐 Translations
- ♿ Accessibility improvements

---

## 🛡️ Security

### Audit Status

Smart contracts should undergo professional security audits before mainnet deployment with significant value.

### Reporting Vulnerabilities

Please report security vulnerabilities to: **security@drip-protocol.com** (or create appropriate contact)

Do not open public issues for security concerns.

### Best Practices

- Never share private keys
- Always verify contract addresses
- Test with small amounts first
- Use hardware wallets for large amounts
- Verify transactions before signing

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stacks Foundation** - For building Bitcoin's smart contract layer
- **Hiro Systems** - For excellent developer tools (Clarinet, Stacks.js)
- **shadcn** - For the beautiful UI component system
- **The Stacks Community** - For continuous support and feedback

---

## 📞 Support & Community

- **Documentation**: [docs.drip-protocol.com](#) (Update with actual link)
- **Discord**: [Join our community](#) (Update with actual link)
- **Twitter**: [@DripProtocol](#) (Update with actual handle)
- **GitHub Issues**: [Report bugs or request features](https://github.com/gid-ctl/drip-protocol/issues)

---

## 🗺️ Roadmap

### Current Version (v1.0)

- ✅ sBTC & STX streaming payments
- ✅ Linear vesting mechanism
- ✅ Stream creation, withdrawal, and cancellation
- ✅ Web dashboard with real-time updates
- ✅ Wallet integration (Leather, Xverse)

### Future Enhancements

- 🔜 Multi-token support (other SIP-010 tokens)
- 🔜 Recurring streams (salary automation)
- 🔜 Batch operations (create multiple streams)
- 🔜 Stream templates (reusable configurations)
- 🔜 Advanced analytics and reporting
- 🔜 Mobile application (iOS/Android)
- 🔜 DAO governance integration
- 🔜 NFT-gated streams

---

<div align="center">

**Made with ❤️ for the Bitcoin economy**

[↑ Back to Top](#drip-protocol)

</div>
