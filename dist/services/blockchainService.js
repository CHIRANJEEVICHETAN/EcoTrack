var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Web3 from 'web3';
// Use Sepolia testnet for production
const BLOCKCHAIN_NODE_URL = import.meta.env.VITE_NODE_ENV === 'production'
    ? `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`
    : 'http://127.0.0.1:8545';
const ADMIN_PRIVATE_KEY = import.meta.env.VITE_ADMIN_PRIVATE_KEY || '';
class BlockchainService {
    constructor() {
        this.web3 = new Web3(BLOCKCHAIN_NODE_URL);
        // Use different contract addresses for development and production
        this.contractAddress = import.meta.env.VITE_NODE_ENV === 'production'
            ? import.meta.env.VITE_PRODUCTION_CONTRACT_ADDRESS
            : import.meta.env.VITE_CONTRACT_ADDRESS || '';
        this.initializeContract();
    }
    initializeContract() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const networkId = yield this.web3.eth.net.getId();
                const response = yield fetch('/contracts/EWasteTracking.json');
                const contractJson = yield response.json();
                this.contract = new this.web3.eth.Contract(contractJson.abi, this.contractAddress);
                console.log('Contract initialized at:', this.contractAddress);
            }
            catch (error) {
                console.error('Failed to initialize contract:', error);
            }
        });
    }
    recordWasteItem(itemData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = this.web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
                this.web3.eth.accounts.wallet.add(account);
                const gas = yield this.contract.methods
                    .recordWasteItem(itemData.id, itemData.itemType, itemData.weight, itemData.timestamp, itemData.userId)
                    .estimateGas({ from: account.address });
                const transaction = yield this.contract.methods
                    .recordWasteItem(itemData.id, itemData.itemType, itemData.weight, itemData.timestamp, itemData.userId)
                    .send({
                    from: account.address,
                    gas: Math.floor(gas * 1.5)
                });
                return transaction.transactionHash;
            }
            catch (error) {
                console.error('Blockchain recording error:', error);
                throw new Error('Failed to record on blockchain');
            }
        });
    }
    getWasteItemHistory(itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const history = yield this.contract.methods.getWasteItemHistory(itemId).call();
                return {
                    itemType: history[0],
                    weight: Number(history[1]),
                    timestamp: Number(history[2]),
                    status: this.getStatusString(Number(history[3])),
                    handlers: history[4]
                };
            }
            catch (error) {
                console.error('Blockchain retrieval error:', error);
                throw new Error('Failed to retrieve from blockchain');
            }
        });
    }
    getStatusString(status) {
        const statusMap = ['Pending', 'InProgress', 'Completed'];
        return statusMap[status] || 'Unknown';
    }
    verifyVendor(vendorId, certifications) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = this.web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
                this.web3.eth.accounts.wallet.add(account);
                const gas = yield this.contract.methods
                    .verifyVendor(vendorId, certifications)
                    .estimateGas({ from: account.address });
                const transaction = yield this.contract.methods
                    .verifyVendor(vendorId, certifications)
                    .send({
                    from: account.address,
                    gas: Math.floor(gas * 1.5)
                });
                return transaction.transactionHash;
            }
            catch (error) {
                console.error('Vendor verification error:', error);
                throw new Error('Failed to verify vendor on blockchain');
            }
        });
    }
    isConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.web3.eth.net.isListening();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
}
export const blockchainService = new BlockchainService();
