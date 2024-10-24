// scripts/initialize.ts
import { ethers, network, run } from 'hardhat';
import { ContractFactory } from 'ethers';
import fs from 'fs';

async function main() {
    const [deployer] = await ethers.getSigners();

    // Read deployed addresses from the file
    const data = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));

    const pegasysTokenV2Address = data.implementationAddress;
    const proxyAddress = data.proxyAddress;
    let pegasysTokenAddress = process.env.PEGASYS_ADDRESS;
    let governanceAddress = process.env.GOVERNANCE_ADDRESS;

    console.log('Initializing contracts with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Deploy PegasysToken if not provided
    if (!pegasysTokenAddress) {
        // Deploy MintableERC20 as PegasysToken
        const MintableERC20Factory: ContractFactory = await ethers.getContractFactory('MintableErc20');
        const mintablePegasysToken = await MintableERC20Factory.deploy('Pegasys', 'PSYS', 18);
        await mintablePegasysToken.deployed();

        pegasysTokenAddress = mintablePegasysToken.address;
        console.log('Mintable PegasysToken deployed to:', pegasysTokenAddress);
    } else {
        console.log('Using PegasysToken address from environment variable:', pegasysTokenAddress);
    }

    // Deploy governance contract if not provided
    if (!governanceAddress) {
        // Deploy MockTransferHook as governance contract
        const MockTransferHookFactory: ContractFactory = await ethers.getContractFactory('MockTransferHook');
        const mockTransferHook = await MockTransferHookFactory.deploy();
        await mockTransferHook.deployed();

        governanceAddress = mockTransferHook.address;
        console.log('MockTransferHook deployed to:', governanceAddress);
    } else {
        console.log('Using governance address from environment variable:', governanceAddress);
    }

    // Update deployment data with new addresses
    data.pegasysTokenAddress = pegasysTokenAddress;
    data.governanceAddress = governanceAddress;

    fs.writeFileSync('deployment.json', JSON.stringify(data, null, 2));

    console.log('Using the following addresses:');
    console.log('PegasysTokenV2 implementation:', pegasysTokenV2Address);
    console.log('Proxy:', proxyAddress);
    console.log('PegasysToken:', pegasysTokenAddress);
    console.log('Governance:', governanceAddress);

    // Get the contracts
    const pegasysTokenV2 = await ethers.getContractAt('PegasysTokenV2', pegasysTokenV2Address);
    const proxy = await ethers.getContractAt('InitializableAdminUpgradeabilityProxy', proxyAddress);

    // Prepare initialization data
    const initializeData = pegasysTokenV2.interface.encodeFunctionData('initialize', [
        pegasysTokenAddress,
        governanceAddress,
    ]);

    // Initialize the proxy with implementation address, admin, and initialization data
    const tx = await proxy['initialize(address,address,bytes)'](
        pegasysTokenV2Address,
        governanceAddress,
        initializeData
    );
    await tx.wait();
    console.log('Proxy initialized with implementation, admin set to governance, and data');


    // Verify contracts if not on hardhat network
    if (network.name == 'rollux') {
        console.log('Waiting for Blockscout to index the contracts...');
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

        try {
            if (!process.env.PEGASYS_ADDRESS) {
                console.log('Verifying Mintable PegasysToken...');
                await run('verify:verify', {
                    address: pegasysTokenAddress,
                    constructorArguments: ['Pegasys', 'PSYS', 18],
                });
            }

            if (!process.env.GOVERNANCE_ADDRESS) {
                console.log('Verifying MockTransferHook...');
                await run('verify:verify', {
                    address: governanceAddress,
                    constructorArguments: [],
                });
            }
        } catch (error) {
            console.error('Verification failed:', error);
        }
    }

    console.log('Initialization script completed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});