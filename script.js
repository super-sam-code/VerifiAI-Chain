// Main application functionality for AI-Blockchain Integration Platform

// Global variables
let web3;
let currentAccount = null;
let isConnected = false;
let fileHash = null;
let modelMetadata = {};
let provenanceData = [];

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

// Initialize the application
async function initApp() {
    console.log('Initializing application...');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Initialize Web3
            web3 = new Web3(window.ethereum);
            console.log('Web3 initialized');
            
            // Update connection status UI
            updateConnectionStatus();
            
            // Load any previously saved data
            loadSavedProvenanceData();
        } catch (error) {
            console.error('Error initializing Web3:', error);
            showNotification('Error initializing blockchain connection', 'error');
        }
    } else {
        console.warn('MetaMask not detected');
        showNotification('Please install MetaMask to use blockchain features', 'warning');
        document.getElementById('wallet-status').innerText = 'MetaMask not detected';
    }
    
    // Initialize UI components
    updateDashboard();
}

// Set up event listeners for the UI
function setupEventListeners() {
    // Wallet connection
    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    
    // File upload for model or dataset
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    
    // Form submissions
    document.getElementById('verification-form').addEventListener('submit', verifyModel);
    document.getElementById('provenance-form').addEventListener('submit', trackProvenance);
    document.getElementById('governance-form').addEventListener('submit', submitGovernanceProposal);
    
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
    });
    
    // Modal controls
    document.querySelectorAll('.modal-open-btn').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal')));
    });
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
}

// Connect to the Ethereum wallet
async function connectWallet() {
    try {
        console.log('Connecting to wallet...');
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        currentAccount = accounts[0];
        isConnected = true;
        
        console.log('Connected to wallet:', currentAccount);
        showNotification('Wallet connected successfully', 'success');
        
        // Update UI
        updateConnectionStatus();
        
        // Set up listener for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Load smart contract data
        await loadContractData();
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        showNotification('Failed to connect wallet', 'error');
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        currentAccount = null;
        isConnected = false;
        showNotification('Wallet disconnected', 'info');
    } else if (accounts[0] !== currentAccount) {
        // User switched accounts
        currentAccount = accounts[0];
        showNotification('Account changed to ' + shortenAddress(currentAccount), 'info');
    }
    
    updateConnectionStatus();
}

// Update the connection status UI
function updateConnectionStatus() {
    const statusElement = document.getElementById('wallet-status');
    const connectButton = document.getElementById('connect-wallet');
    
    if (isConnected && currentAccount) {
        statusElement.innerHTML = `Connected: <span class="address">${shortenAddress(currentAccount)}</span>`;
        statusElement.classList.add('connected');
        connectButton.innerText = 'Switch Wallet';
        
        // Enable blockchain features
        document.querySelectorAll('.blockchain-feature').forEach(el => {
            el.classList.remove('disabled');
        });
    } else {
        statusElement.innerText = 'Not Connected';
        statusElement.classList.remove('connected');
        connectButton.innerText = 'Connect Wallet';
        
        // Disable blockchain features
        document.querySelectorAll('.blockchain-feature').forEach(el => {
            el.classList.add('disabled');
        });
    }
}

// Handle file upload and calculate hash
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Display file info
        document.getElementById('file-name').innerText = file.name;
        document.getElementById('file-size').innerText = formatFileSize(file.size);
        document.getElementById('file-type').innerText = file.type || 'Unknown';
        
        // Show loading indicator
        const hashElement = document.getElementById('file-hash');
        hashElement.innerText = 'Calculating...';
        
        // Calculate file hash
        fileHash = await calculateFileHash(file);
        hashElement.innerText = fileHash;
        
        showNotification('File processed successfully', 'success');
        
        // Enable verification button
        document.getElementById('verify-button').disabled = false;
    } catch (error) {
        console.error('Error processing file:', error);
        showNotification('Error processing file', 'error');
    }
}

// Calculate SHA-256 hash of a file
async function calculateFileHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const buffer = event.target.result;
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// Verify AI model against blockchain records
async function verifyModel(event) {
    event.preventDefault();
    
    if (!isConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    if (!fileHash) {
        showNotification('Please upload a file first', 'warning');
        return;
    }
    
    try {
        // Show loading state
        const verificationResult = document.getElementById('verification-result');
        verificationResult.innerHTML = '<div class="loading">Verifying...</div>';
        
        // Collect form data
        const modelId = document.getElementById('model-id').value;
        const modelVersion = document.getElementById('model-version').value;
        
        // Call smart contract verification function
        const isVerified = await verifyModelOnBlockchain(modelId, modelVersion, fileHash);
        
        // Store metadata
        modelMetadata = {
            id: modelId,
            version: modelVersion,
            hash: fileHash,
            timestamp: new Date().toISOString(),
            verified: isVerified
        };
        
        // Update UI based on verification result
        if (isVerified) {
            verificationResult.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <span>Model verified successfully</span>
                </div>
                <div class="details">
                    <p>Model ID: ${modelId}</p>
                    <p>Version: ${modelVersion}</p>
                    <p>Hash: ${shortenHash(fileHash)}</p>
                </div>
            `;
            showNotification('Model verified successfully', 'success');
        } else {
            verificationResult.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Model verification failed</span>
                </div>
                <div class="details">
                    <p>The provided model could not be verified against blockchain records.</p>
                </div>
            `;
            showNotification('Model verification failed', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        document.getElementById('verification-result').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error during verification</span>
            </div>
        `;
        showNotification('Error during verification process', 'error');
    }
}

// Track data provenance
async function trackProvenance(event) {
    event.preventDefault();
    
    if (!isConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        // Collect form data
        const dataSource = document.getElementById('data-source').value;
        const dataDescription = document.getElementById('data-description').value;
        const dataLicense = document.getElementById('data-license').value;
        
        // Show loading state
        const provenanceResult = document.getElementById('provenance-result');
        provenanceResult.innerHTML = '<div class="loading">Recording provenance...</div>';
        
        // Call smart contract function to record provenance
        const transactionHash = await recordProvenanceOnBlockchain(
            dataSource,
            fileHash || 'No file uploaded',
            dataDescription,
            dataLicense
        );
        
        // Create provenance record
        const provenanceRecord = {
            id: generateId(),
            source: dataSource,
            description: dataDescription,
            license: dataLicense,
            hash: fileHash || 'No file uploaded',
            timestamp: new Date().toISOString(),
            transactionHash: transactionHash
        };
        
        // Add to local records
        provenanceData.push(provenanceRecord);
        saveProvenanceData();
        
        // Update UI
        provenanceResult.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <span>Provenance recorded successfully</span>
            </div>
            <div class="details">
                <p>Transaction: ${shortenHash(transactionHash)}</p>
                <p><a href="#" onclick="viewTransaction('${transactionHash}')">View on Blockchain Explorer</a></p>
            </div>
        `;
        
        // Update dashboard
        updateProvenanceList();
        showNotification('Data provenance recorded successfully', 'success');
    } catch (error) {
        console.error('Provenance tracking error:', error);
        document.getElementById('provenance-result').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error recording provenance</span>
            </div>
        `;
        showNotification('Error recording data provenance', 'error');
    }
}

// Submit governance proposal
async function submitGovernanceProposal(event) {
    event.preventDefault();
    
    if (!isConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    try {
        // Collect form data
        const proposalTitle = document.getElementById('proposal-title').value;
        const proposalDescription = document.getElementById('proposal-description').value;
        const proposalType = document.getElementById('proposal-type').value;
        
        // Show loading state
        const governanceResult = document.getElementById('governance-result');
        governanceResult.innerHTML = '<div class="loading">Submitting proposal...</div>';
        
        // Call smart contract function
        const proposalId = await submitProposalToBlockchain(
            proposalTitle,
            proposalDescription,
            proposalType
        );
        
        // Update UI
        governanceResult.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <span>Proposal submitted successfully</span>
            </div>
            <div class="details">
                <p>Proposal ID: ${proposalId}</p>
                <p>Title: ${proposalTitle}</p>
                <p>Status: Pending</p>
            </div>
        `;
        showNotification('Governance proposal submitted', 'success');
    } catch (error) {
        console.error('Governance submission error:', error);
        document.getElementById('governance-result').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error submitting proposal</span>
            </div>
        `;
        showNotification('Error submitting governance proposal', 'error');
    }
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Activate selected tab and button
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Update the dashboard with latest data
function updateDashboard() {
    updateProvenanceList();
    updateModelsList();
    updateGo

