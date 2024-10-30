// scripts/initialize.ts
import { ethers, network, run } from 'hardhat';
import fs from 'fs';

async function main() {
    const [deployer] = await ethers.getSigners();
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

    // Read deployed addresses from the file
    const data = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));

    const pegasysTokenV2Address = data.implementationAddress;
    const proxyAddress = data.proxyAddress;
    let pegasysTokenAddress = process.env.PEGASYS_ADDRESS;

    console.log('Initializing contracts with the account:', deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance));

    // Deploy PegasysToken if not provided
    if (!pegasysTokenAddress) {
        // Deploy MintableERC20 as PegasysToken
        const MintableERC20Factory = await ethers.getContractFactory('MintableErc20');
        const mintablePegasysToken = await MintableERC20Factory.deploy('Pegasys', 'PSYS', 18);
        await mintablePegasysToken.waitForDeployment();
        pegasysTokenAddress = await mintablePegasysToken.getAddress();
        console.log('Mintable PegasysToken deployed to:', pegasysTokenAddress);
    }

    // Update deployment data with new addresses
    data.pegasysTokenAddress = pegasysTokenAddress;
    fs.writeFileSync('deployment.json', JSON.stringify(data, null, 2));

    console.log('Using the following addresses:');
    console.log('PegasysTokenV2 implementation:', pegasysTokenV2Address);
    console.log('Proxy:', proxyAddress);
    console.log('PegasysToken:', pegasysTokenAddress);

    // Get the contracts
    const pegasysTokenV2 = await ethers.getContractAt('PegasysTokenV2', pegasysTokenV2Address);
    const proxy = await ethers.getContractAt('InitializableAdminUpgradeabilityProxy', proxyAddress);

    // Prepare initialization data
    const initializeData = pegasysTokenV2.interface.encodeFunctionData('initialize', [
        pegasysTokenAddress,
        ZERO_ADDRESS,
    ]);

    // Initialize the proxy with implementation address, admin, and initialization data
    const tx = await proxy['initialize(address,address,bytes)'](
        pegasysTokenV2Address,
        deployer.address,
        initializeData
    );
    await tx.wait();
    console.log('Proxy initialized with implementation, admin set to governance, and data');

    // Verify contracts if not on hardhat network
    if (network.name === 'rollux') {
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