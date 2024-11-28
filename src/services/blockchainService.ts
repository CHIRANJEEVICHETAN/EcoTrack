import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { ContractAbi } from 'web3-types';
import type { EventLog } from 'web3-types';

// Use Sepolia testnet for production
const BLOCKCHAIN_NODE_URL = `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`;
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID || '';
const ADMIN_PRIVATE_KEY = import.meta.env.VITE_ADMIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Define event types
interface WasteItemRecordedEvent extends EventLog {
  returnValues: {
    itemId: string;
    itemType: string;
    weight: string;
    timestamp: string;
    userId: string;
  };
}

class BlockchainService {
  private web3: Web3;
  private contract: any = null;
  private initialized: boolean = false;

  constructor() {
    const nodeUrl = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;
    this.web3 = new Web3(nodeUrl);
  }

  private logError(message: string, error: any) {
    if (import.meta.env.DEV) {
      console.error(message, error);
    }
  }

  private logInfo(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeContract();
    }
  }

  async initializeContract() {
    if (this.initialized) return;

    try {
      const networkId = await this.web3.eth.net.getId();
      this.logInfo('Connected to network ID:', networkId);

      const response = await fetch('/contracts/EWasteTracking.json');
      if (!response.ok) {
        throw new Error('Failed to load contract ABI');
      }
      
      const contractJson = await response.json();
      if (!contractJson.abi) {
        throw new Error('Invalid contract ABI format');
      }

      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured');
      }

      // Initialize contract
      this.contract = new this.web3.eth.Contract(
        contractJson.abi,
        CONTRACT_ADDRESS
      );

      // Verify contract exists at address
      const code = await this.web3.eth.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        throw new Error('No contract deployed at specified address');
      }

      this.initialized = true;
      this.logInfo('Contract initialized successfully at:', CONTRACT_ADDRESS);
    } catch (error) {
      this.logError('Contract initialization error:', error);
      throw new Error('Failed to initialize blockchain contract');
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
      await this.ensureInitialized();
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      const account = this.web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
      
      try {
        this.web3.eth.accounts.wallet.remove(account.address);
      } catch (e) {
        // Ignore removal errors
      }
      
      this.web3.eth.accounts.wallet.add(account);

      this.logInfo('Recording waste item with ID:', itemData.id);
      
      const gas = await this.contract.methods
        .recordWasteItem(
          itemData.id,
          itemData.itemType,
          itemData.weight,
          itemData.timestamp,
          itemData.userId
        )
        .estimateGas({ from: account.address });

      this.logInfo('Estimated gas:', gas.toString());

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
          gas: Math.floor(Number(gas) * 1.5).toString()
        });

      this.logInfo('Transaction hash:', transaction.transactionHash);
      return transaction.transactionHash;
    } catch (error) {
      this.logError('Blockchain recording error:', error);
      throw new Error('Failed to record on blockchain');
    }
  }

  async getWasteItemHistory(itemId: string) {
    try {
      await this.ensureInitialized();
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const events = (await this.contract.getPastEvents('WasteItemRecorded', {
        filter: { itemId },
        fromBlock: 0,
        toBlock: 'latest'
      })) as WasteItemRecordedEvent[];

      const result = await this.contract.methods.getWasteItemHistory(itemId).call();
      
      const [itemType, weight, timestamp, status, handlers] = [
        result[0],
        result[1],
        result[2],
        result[3],
        result[4]
      ];

      return {
        itemType: itemType || '',
        weight: weight ? Number(weight) : 0,
        timestamp: timestamp ? Number(timestamp) : 0,
        status: this.getStatusString(Number(status || 0)),
        handlers: handlers || [],
        transactionHash: events[0]?.transactionHash || ''
      };
    } catch (error) {
      this.logError('Blockchain retrieval error:', error);
      
      if (error.message?.includes('revert')) {
        throw new Error('Item not found on blockchain');
      }
      
      throw new Error('Failed to retrieve from blockchain');
    }
  }

  private getStatusString(status: number): string {
    const statusMap = ['Pending', 'InProgress', 'Completed'];
    return statusMap[status] || 'Unknown';
  }
}

export const blockchainService = new BlockchainService();