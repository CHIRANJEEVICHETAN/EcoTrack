[![Netlify Status](https://api.netlify.com/api/v1/badges/f69a45ed-4a5f-4392-b6cb-2060975d285b/deploy-status)](https://app.netlify.com/sites/e-waste-ecotrack/deploys)

# EcoTrack - E-Waste Management System

EcoTrack is a comprehensive full-stack web application designed to facilitate efficient tracking, segregation, and recycling of electronic waste (e-waste). The platform leverages modern technologies including AI-powered recommendations, blockchain verification, and multilingual support.

## 🌟 Features

- **E-Waste Tracking**: Real-time tracking from generation to final disposal
- **AI-Powered Waste Segregation**: Smart recommendations using Google's Generative AI
- **Blockchain Integration**: Tamper-proof ledger for transparency
- **Vendor Verification**: Robust vetting and rating system
- **Data Visualization**: Interactive dashboards and analytics
- **Multilingual Support**: Available in multiple languages
- **User Profiles**: Track individual contributions and impact

## 🚀 Tech Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase
- **Blockchain**: Local Ganache/Truffle setup
- **AI**: Google Generative AI
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Internationalization**: i18next

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ganache (for local blockchain)
- Google Cloud API Key (for AI features)
- Firebase account

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ecotrack.git
cd ecotrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_API_KEY=your_google_api_key
```

4. Start the local blockchain:
```bash
cd Blockchain
npm install
npm run ganache
```

5. Deploy smart contracts:
```bash
npx truffle migrate
```

6. Start the development server:
```bash
npm run dev
```

## 🌐 Available Languages

- English (en)
- Spanish (es)
- More languages can be added in the i18n configuration

## 🔐 Authentication

The system supports multiple authentication methods:
- Email/Password
- Google Sign-in

## 👥 User Roles

1. **Regular Users**
   - Submit e-waste items
   - Track recycling status
   - View personal impact

2. **Vendors**
   - Process e-waste submissions
   - Update recycling status
   - Submit processing data

3. **Administrators**
   - Manage users and vendors
   - View system analytics
   - Verify vendors

## 📊 Features in Detail

### E-Waste Submission
- Image analysis using AI
- Automatic categorization
- Real-time tracking
- Blockchain verification

### Vendor Management
- Certification verification
- Performance metrics
- Resource usage tracking
- Material purity rates

### Analytics Dashboard
- Recycling trends
- Environmental impact
- User contributions
- Resource utilization

## 🔧 Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Blockchain Development
```bash
# Start local blockchain
npm run ganache

# Deploy contracts
npx truffle migrate

# Deploy to testnet
npx truffle migrate --network testnet
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Generative AI for waste analysis
- Firebase for backend services
- Truffle Suite for blockchain development
- All contributors and supporters

## 📞 Support

For support, email support@ecotrack.com or join our Slack channel.
