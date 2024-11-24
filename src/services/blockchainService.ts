import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// Replace hardcoded values with Vite environment variables
const BLOCKCHAIN_NODE_URL = import.meta.env.VITE_BLOCKCHAIN_NODE_URL || 'http://127.0.0.1:8545';
const ADMIN_PRIVATE_KEY = import.meta.env.VITE_ADMIN_PRIVATE_KEY || '';

class BlockchainService {
  private web3: Web3;
  private contract: Contract<any>;
  private contractAddress: string;

  constructor() {
    this.web3 = new Web3(BLOCKCHAIN_NODE_URL);
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
    this.initializeContract();
  }

  private async initializeContract() {
    try {
      // Get the network ID
      const networkId = await this.web3.eth.net.getId();
      
      // Get contract instance without build file dependency
      const response = await fetch('/contracts/EWasteTracking.json');
      const contractJson = await response.json();
      
      // Initialize contract instance
      this.contract = new this.web3.eth.Contract(
        contractJson.abi,
        this.contractAddress
      );

      console.log('Contract initialized at:', this.contractAddress);
    } catch (error) {
      console.error('Failed to initialize contract:', error);
    }
  }

  async recordWasteItem(itemData: {
    id: string;
    itemType: string;
    weight: number;
    timestamp: number;
    userId: string;
  }) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(account);

      const gas = await this.contract.methods
        .recordWasteItem(
          itemData.id,
          itemData.itemType,
          itemData.weight,
          itemData.timestamp,
          itemData.userId
        )
        .estimateGas({ from: account.address });

      const transaction = await this.contract.methods
        .recordWasteItem(
          itemData.id,
          itemData.itemType,
          itemData.weight,
          itemData.timestamp,
          itemData.userId
        )
        .send({
          from: account.address,
          gas: Math.floor(gas * 1.5) // Add 50% buffer for gas estimation
        });

      return transaction.transactionHash;
    } catch (error) {
      console.error('Blockchain recording error:', error);
      throw new Error('Failed to record on blockchain');
    }
  }

  async getWasteItemHistory(itemId: string) {
    try {
      const history = await this.contract.methods.getWasteItemHistory(itemId).call();
      return {
        itemType: history[0],
        weight: Number(history[1]),
        timestamp: Number(history[2]),
        status: this.getStatusString(Number(history[3])),
        handlers: history[4]
      };
    } catch (error) {
      console.error('Blockchain retrieval error:', error);
      throw new Error('Failed to retrieve from blockchain');
    }
  }

  private getStatusString(status: number): string {
    const statusMap = ['Pending', 'InProgress', 'Completed'];
    return statusMap[status] || 'Unknown';
  }

  async verifyVendor(vendorId: string, certifications: string[]) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(account);

      const gas = await this.contract.methods
        .verifyVendor(vendorId, certifications)
        .estimateGas({ from: account.address });

      const transaction = await this.contract.methods
        .verifyVendor(vendorId, certifications)
        .send({
          from: account.address,
          gas: Math.floor(gas * 1.5)
        });

      return transaction.transactionHash;
    } catch (error) {
      console.error('Vendor verification error:', error);
      throw new Error('Failed to verify vendor on blockchain');
    }
  }

  // Helper method to check connection
  async isConnected(): Promise<boolean> {
    try {
      await this.web3.eth.net.isListening();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();