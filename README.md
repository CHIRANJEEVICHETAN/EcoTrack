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

Image Analysis Results
The provided image is a base64 encoded JPEG. I need to decode and see the image to analyze it. I cannot process base64 encoded data directly. Please provide the image in a different format (like a .jpg file upload) or describe the contents of the image. Once I have a visual representation of the electronic waste, I can provide information on its: 1. **Material Composition:** I will identify the different materials present, such as plastics (types of plastics), metals (aluminum, copper, iron, precious metals like gold), glass, printed circuit boards (PCBs), and other components. 2. **Recycling Difficulty Level:** This will be assessed based on the complexity of separating the different materials, the presence of hazardous substances (like lead, mercury, cadmium), and the availability of suitable recycling infrastructure for specific components. The difficulty will be categorized as (e.g., Easy, Moderate, Difficult, Very Difficult). 3. **Recommended Handling Procedure:** This will outline the steps for safe and responsible disposal or recycling, including pre-processing (disassembly if necessary), sorting of materials, and proper disposal channels for each material type. This will include recommendations for professional e-waste recycling services where appropriate.