// scripts/deploy.ts
import { ethers, network, run } from 'hardhat';
import fs from 'fs';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance));

    // Deploy the implementation contract
    const PegasysTokenV2Factory = await ethers.getContractFactory('PegasysTokenV2');
    const pegasysTokenV2 = await PegasysTokenV2Factory.deploy();
    await pegasysTokenV2.waitForDeployment();
    // Updated: get address
    const pegasysTokenV2Address = await pegasysTokenV2.getAddress();

    console.log('PegasysTokenV2 implementation deployed to:', pegasysTokenV2Address);

    // Deploy the proxy contract
    const ProxyFactory = await ethers.getContractFactory('InitializableAdminUpgradeabilityProxy');
    const proxy = await ProxyFactory.deploy();
    // Updated: wait for deployment
    await proxy.waitForDeployment();
    // Updated: get address
    const proxyAddress = await proxy.getAddress();

    console.log('Proxy deployed to:', proxyAddress);

    // Save deployed addresses to a file
    const data = {
        network: network.name,
        implementationAddress: pegasysTokenV2Address,
        proxyAddress: proxyAddress,
    };

    fs.writeFileSync('deployment.json', JSON.stringify(data, null, 2));

    // Verify contracts if on Rollux network
    if (network.name === 'rollux') {
        console.log('Waiting for Blockscout to index the contracts...');
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

        try {
            console.log('Verifying PegasysTokenV2...');
            await run('verify:verify', {
                address: pegasysTokenV2Address,
                constructorArguments: [],
            });

            console.log('Verifying Proxy...');
            await run('verify:verify', {
                address: proxyAddress,
                constructorArguments: [],
            });
        } catch (error) {
            console.error('Verification failed:', error);
        }
    }

    console.log('Deployment script completed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});