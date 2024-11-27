const HDWalletProvider = require('@truffle/hdwallet-provider'); // Import HDWalletProvider

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1", // Localhost for Ganache
            port: 8545,        // Default Ganache port
            network_id: "*"    // Match any network ID
        },
        sepolia: {
            provider: () => new HDWalletProvider(
                process.env.MNEMONIC, // Wallet mnemonic phrase from environment variable
                `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}` // Infura project endpoint
            ),
            network_id: 11155111, // Sepolia network ID
            gas: 5500000,         // Gas limit
            confirmations: 2,     // Number of confirmations to wait between deployments
            timeoutBlocks: 200,   // Timeout for blocks
            skipDryRun: true      // Skip dry run before migrations
        }
    },
    compilers: {
        solc: {
            version: "0.8.0" // Solidity compiler version
        }
    }
};
