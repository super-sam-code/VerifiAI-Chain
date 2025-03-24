/**
 * Smart contract interaction module for AI-Blockchain Integration Platform
 * Handles model verification, provenance tracking, and governance features
 */

// Smart contract ABI and address configuration
const CONTRACT_ADDRESS = "0x123456789AbCdEf0123456789aBcDeF01234567"; // Replace with actual deployed contract address

// Sample ABI - Replace with actual ABI from your deployed contract
const CONTRACT_ABI = [
    // Model Verification Methods
    {
        "inputs": [
            { "internalType": "string", "name": "modelId", "type": "string" },
            { "internalType": "string", "name": "modelHash", "type": "string" },
            { "internalType": "string", "name": "metadataURI", "type": "string" }
        ],
        "name": "registerModel",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "modelId", "type": "string" }],
        "name": "verifyModel",
        "outputs": [
            { "internalType": "bool", "name": "verified", "type": "bool" },
            { "internalType": "string", "name": "modelHash", "type": "string" },
            { "internalType": "string", "name": "metadataURI", "type": "string" },
            { "internalType": "address", "name": "registeredBy", "type": "address" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    
    // Provenance Tracking Methods
    {
        "inputs": [
            { "internalType": "string", "name": "datasetId", "type": "string" },
            { "internalType": "string", "name": "datasetHash", "type": "string" },
            { "internalType": "string", "name": "sourceInfo", "type": "string" }
        ],
        "name": "registerDataset",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "datasetId", "type": "string" }],
        "name": "getDatasetProvenance",
        "outputs": [
            { "internalType": "string", "name": "datasetHash", "type": "string" },
            { "internalType": "string", "name": "sourceInfo", "type": "string" },
            { "internalType": "address", "name": "registeredBy", "type": "address" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    
    // Governance Methods
    {
        "inputs": [
            { "internalType": "string", "name": "proposalId", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "string", "name": "action", "type": "string" }
        ],
        "name": "createGovernanceProposal",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "proposalId", "type": "string" },
            { "internalType": "bool", "name": "support", "type": "bool" }
        ],
        "name": "voteOnProposal",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "proposalId", "type": "string" }],
        "name": "getProposalStatus",
        "outputs": [
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "string", "name": "action", "type": "string" },
            { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
            { "internalType": "uint256", "name": "noVotes", "type": "uint256" },
            { "internalType": "bool", "name": "executed", "type": "bool" },
            { "internalType": "address", "name": "proposer", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let aiVerificationContract;
let web3Instance;
let currentAccount;

/**
 * Initializes the smart contract with a Web3 provider
 * @param {object} web3 - Web3 instance
 * @returns {object} Initialized contract instance
 */
async function initializeContract(web3) {
    try {
        web3Instance = web3;
        aiVerificationContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // Get connected account
        const accounts = await web3.eth.getAccounts();
        currentAccount = accounts[0];
        
        console.log("Smart contract initialized with account:", currentAccount);
        return aiVerificationContract;
    } catch (error) {
        console.error("Contract initialization failed:", error);
        throw error;
    }
}

/**
 * Changes the current account
 * @param {string} account - Ethereum address to set as current account
 */
function setCurrentAccount(account) {
    currentAccount = account;
    console.log("Current account changed to:", currentAccount);
}

// Model Verification Methods

/**
 * Registers a new AI model on the blockchain
 * @param {string} modelId - Unique identifier for the model
 * @param {string} modelHash - SHA-256 hash of the model file
 * @param {string} metadataURI - URI pointing to model metadata (IPFS/HTTP)
 * @returns {Promise<boolean>} Success status
 */
async function registerModel(modelId, modelHash, metadataURI) {
    try {
        const result = await aiVerificationContract.methods
            .registerModel(modelId, modelHash, metadataURI)
            .send({ from: currentAccount });
        
        console.log("Model registration transaction:", result);
        return result.status;
    } catch (error) {
        console.error("Model registration failed:", error);
        throw error;
    }
}

/**
 * Verifies an AI model against blockchain records
 * @param {string} modelId - Model identifier to verify
 * @returns {Promise<object>} Model verification details
 */
async function verifyModel(modelId) {
    try {
        const result = await aiVerificationContract.methods
            .verifyModel(modelId)
            .call();
        
        return {
            verified: result.verified,
            modelHash: result.modelHash,
            metadataURI: result.metadataURI,
            registeredBy: result.registeredBy,
            timestamp: new Date(Number(result.timestamp) * 1000).toISOString()
        };
    } catch (error) {
        console.error("Model verification failed:", error);
        throw error;
    }
}

// Provenance Tracking Methods

/**
 * Registers dataset provenance information
 * @param {string} datasetId - Unique identifier for the dataset
 * @param {string} datasetHash - SHA-256 hash of the dataset
 * @param {string} sourceInfo - JSON string with source information
 * @returns {Promise<boolean>} Success status
 */
async function registerDataset(datasetId, datasetHash, sourceInfo) {
    try {
        const result = await aiVerificationContract.methods
            .registerDataset(datasetId, datasetHash, sourceInfo)
            .send({ from: currentAccount });
        
        console.log("Dataset registration transaction:", result);
        return result.status;
    } catch (error) {
        console.error("Dataset registration failed:", error);
        throw error;
    }
}

/**
 * Retrieves dataset provenance information
 * @param {string} datasetId - Dataset identifier to query
 * @returns {Promise<object>} Dataset provenance details
 */
async function getDatasetProvenance(datasetId) {
    try {
        const result = await aiVerificationContract.methods
            .getDatasetProvenance(datasetId)
            .call();
        
        return {
            datasetHash: result.datasetHash,
            sourceInfo: result.sourceInfo,
            registeredBy: result.registeredBy,
            timestamp: new Date(Number(result.timestamp) * 1000).toISOString()
        };
    } catch (error) {
        console.error("Failed to retrieve dataset provenance:", error);
        throw error;
    }
}

// Governance Interaction Methods

/**
 * Creates a new governance proposal
 * @param {string} proposalId - Unique identifier for the proposal
 * @param {string} description - Human-readable description of the proposal
 * @param {string} action - JSON string with proposed action details
 * @returns {Promise<boolean>} Success status
 */
async function createGovernanceProposal(proposalId, description, action) {
    try {
        const result = await aiVerificationContract.methods
            .createGovernanceProposal(proposalId, description, action)
            .send({ from: currentAccount });
        
        console.log("Proposal creation transaction:", result);
        return result.status;
    } catch (error) {
        console.error("Proposal creation failed:", error);
        throw error;
    }
}

/**
 * Casts a vote on a governance proposal
 * @param {string} proposalId - Proposal identifier
 * @param {boolean} support - Whether to support the proposal
 * @returns {Promise<boolean>} Success status
 */
async function voteOnProposal(proposalId, support) {
    try {
        const result = await aiVerificationContract.methods
            .voteOnProposal(proposalId, support)
            .send({ from: currentAccount });
        
        console.log("Vote transaction:", result);
        return result.status;
    } catch (error) {
        console.error("Voting failed:", error);
        throw error;
    }
}

/**
 * Retrieves the current status of a governance proposal
 * @param {string} proposalId - Proposal identifier
 * @returns {Promise<object>} Proposal details and voting status
 */
async function getProposalStatus(proposalId) {
    try {
        const result = await aiVerificationContract.methods
            .getProposalStatus(proposalId)
            .call();
        
        return {
            description: result.description,
            action: result.action,
            yesVotes: Number(result.yesVotes),
            noVotes: Number(result.noVotes),
            executed: result.executed,
            proposer: result.proposer
        };
    } catch (error) {
        console.error("Failed to retrieve proposal status:", error);
        throw error;
    }
}

// Helper Functions for Blockchain Interactions

/**
 * Checks if the user is connected to the correct network
 * @returns {Promise<boolean>} Whether connected to the expected network
 */
async function checkNetwork() {
    try {
        const networkId = await web3Instance.eth.net.getId();
        // Adjust network ID check based on your target network (1=Mainnet, 3=Ropsten, 4=Rinkeby, 5=Goerli, 42=Kovan)
        const expectedNetwork = 5; // Example: Goerli testnet
        
        if (networkId !== expectedNetwork) {
            console.warn(`Connected to network ${networkId}, but expected network ${expectedNetwork}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Network check failed:", error);
        return false;
    }
}

/**
 * Gets the current gas price from the network
 * @returns {Promise<string>} Current gas price in wei
 */
async function getCurrentGasPrice() {
    try {
        const gasPrice = await web3Instance.eth.getGasPrice();
        // Add 20% buffer for faster confirmation
        const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.2).toString();
        return adjustedGasPrice;
    } catch (error) {
        console.error("Failed to get gas price:", error);
        throw error;
    }
}

/**
 * Estimates gas for a contract method call
 * @param {object} method - Web3 contract method object
 * @param {object} params - Parameters to pass to the method
 * @returns {Promise<number>} Estimated gas limit
 */
async function estimateGas(method, params) {
    try {
        const gasEstimate = await method(...params).estimateGas({ from: currentAccount });
        // Add 30% buffer for safety
        return Math.floor(gasEstimate * 1.3);
    } catch (error) {
        console.error("Gas estimation failed:", error);
        // Return default gas limit if estimation fails
        return 500000;
    }
}

/**
 * Formats a blockchain transaction receipt for display
 * @param {object} receipt - Transaction receipt from Web3
 * @returns {object} Formatted receipt with key details
 */
function formatTransactionReceipt(receipt) {
    return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status ? 'Success' : 'Failed',
        events: Object.keys(receipt.events || {})
    };
}

// Export all functions
export {
    initializeContract,
    setCurrentAccount,
    registerModel,
    verifyModel,
    registerDataset,
    getDatasetProvenance,
    createGovernanceProposal,
    voteOnProposal,
    getProposalStatus,
    checkNetwork,
    getCurrentGasPrice,
    estimateGas,
    formatTransactionReceipt
};

