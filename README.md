# PegasysTokenV2 Design

PegasysTokenV2 (PSYSv2) is an ERC-20 compatible wrapper token for the existing Pegasys (PSYS) token. It implements governance features that allow Pegasys holders to participate in protocol governance through a delegation system. This wrapper approach enables the addition of governance capabilities while maintaining the original PSYS token's functionality.

## Overview

PegasysTokenV2 wraps the existing PSYS token and adds governance features including:

- Voting power delegation
- Proposition power delegation
- Balance snapshots for governance
- EIP-2612 permit functionality for gasless transactions

## Roles

The initial PegasysTokenV2 implementation does not have any admin roles configured. The contract will be proxied using the OpenZeppelin implementation of the EIP-1967 Transparent Proxy pattern. The proxy has an Admin role, and the Admin of the proxy contract will be set upon deployment to the Pegasys governance contracts.

## Features

### ERC-20 Wrapper

- Allows users to deposit PSYS and receive PSYSv2 at a 1:1 ratio
- Enables withdrawal back to PSYS tokens at any time
- Maintains full compatibility with ERC-20 standard

### Governance Features

- Balance snapshot system to track user balances at specific block heights
- Separate tracking for voting and proposition power
- Delegation system allowing users to delegate their voting and proposition powers
- Integration with the Pegasys governance system through transfer hooks

### EIP-2612 Integration

PegasysTokenV2 implements the EIP-2612 `permit` function, enabling:

- Gasless transactions
- Single-transaction approval and transfer operations
- Meta-transactions for improved UX

## Technical Implementation

### Wrapper Mechanism

The wrapper system works through two main functions:

- `deposit()`: Locks PSYS tokens and mints equivalent PSYSv2
- `withdraw()`: Burns PSYSv2 tokens and releases the underlying PSYS

### Transfer Hooks

The `_beforeTokenTransfer` hook is overridden to:

1. Create snapshots of balances during transfers, mints, and burns
2. Update delegation balances
3. Notify the governance contract of transfers

### Changes to OpenZeppelin Contracts

This implementation uses modified versions of OpenZeppelin contracts:

- In `ERC20.sol`, `_name` and `_symbol` are changed from `private` to `internal`
- Uses `VersionedInitializable` instead of `Initializable` to support future upgrades

## Development and Deployment

To deploy PegasysTokenV2 to a local network:

```bash
npx hardhat node
yarn run deploy
yarn run initialize
```

For Rollux:

```bash
yarn run deploy:rollux
yarn run initialize:rollux
```

## License

The contents of this repository are under the AGPLv3 license.

This implementation includes software from OpenZeppelin (https://github.com/OpenZeppelin/openzeppelin-sdk/) licensed under the MIT license, and modifications of Aave Token implementation (https://github.com/aave/aave-token-v2) licensed under the AGPLv3 license.
