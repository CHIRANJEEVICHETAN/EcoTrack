# EcoTrack

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/CHIRANJEEVICHETAN/EcoTrack)

## Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Blockchain
```bash
npm run ganache
```

### 3. Deploy Smart Contract
```bash
npx truffle migrate
```

### 4. Start Development Server
```bash
npm run dev
```

## AI Recommendations Guide

The AI system provides recommendations for e-waste recycling using Google's Generative AI. To use this feature:

1. Upload an image of the e-waste item using the image analyzer
2. Fill in the item details in the form
3. The AI will automatically provide:
   - Best recycling method
   - Environmental impact assessment
   - Additional considerations

### AI Features:
- Image Analysis: Analyzes uploaded images to identify materials and recycling difficulty
- Recycling Recommendations: Suggests optimal recycling methods
- Environmental Impact Assessment: Evaluates the environmental impact

## Blockchain Integration Guide

The project uses a local Ganache blockchain for development. Each e-waste item is tracked on the blockchain with:

1. Item Registration: Records new items with unique IDs
2. Status Updates: Tracks item status changes
3. Vendor Verification: Validates recycling vendors
4. Transaction History: Views complete item lifecycle

### Using Blockchain Features:
1. Ensure Ganache is running (`npm run ganache`)
2. Submit e-waste items through the form
3. Track items using the blockchain verification component
4. View transaction history in the admin dashboard

## Smart Contract Details
- Location: `contracts/EWasteTracking.sol`
- Features:
  - Waste Item Tracking
  - Vendor Management
  - Status Updates
  - Transaction History

## Development Notes
- Ganache runs on `http://127.0.0.1:8545`
- First Ganache account is used as admin
- Smart contract is automatically deployed on first run
- AI features require a valid Google API key in `.env`