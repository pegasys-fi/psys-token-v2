// scripts/deploy.ts
import { ethers, network, run } from 'hardhat';
import { ContractFactory } from 'ethers';
import fs from 'fs';

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Deploy the implementation contract
    const PegasysTokenV2Factory: ContractFactory = await ethers.getContractFactory('PegasysTokenV2');
    const pegasysTokenV2 = await PegasysTokenV2Factory.deploy();
    await pegasysTokenV2.deployed();

    console.log('PegasysTokenV2 implementation deployed to:', pegasysTokenV2.address);

    // Deploy the proxy contract
    const ProxyFactory: ContractFactory = await ethers.getContractFactory('InitializableAdminUpgradeabilityProxy');
    const proxy = await ProxyFactory.deploy();
    await proxy.deployed();

    console.log('Proxy deployed to:', proxy.address);

    // Save deployed addresses to a file
    const data = {
        network: network.name,
        implementationAddress: pegasysTokenV2.address,
        proxyAddress: proxy.address,
    };

    fs.writeFileSync('deployment.json', JSON.stringify(data, null, 2));

    // Verify contracts if not on hardhat network
    if (network.name == 'rollux') {
        console.log('Waiting for Blockscout to index the contracts...');
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

        try {
            console.log('Verifying PegasysTokenV2...');
            await run('verify:verify', {
                address: pegasysTokenV2.address,
                constructorArguments: [],
            });

            console.log('Verifying Proxy...');
            await run('verify:verify', {
                address: proxy.address,
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
