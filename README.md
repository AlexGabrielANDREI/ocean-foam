# 🌊 Ocean Prediction Platform

A Next.js application with Web3 wallet integration (Ethereum Mainnet), Supabase backend, and AI-powered prediction functionality.

## 🚀 Features

- **Web3 Wallet Integration**: MetaMask wallet support (Hedera support disabled)
- **Role-Based Access**: User and Admin roles with different permissions
- **AI Predictions**: ML model predictions with manual and API feature inputs
- **Supabase Integration**: Real-time database and file storage
- **Modern UI**: Beautiful dashboard with Tailwind CSS and custom design system
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Web3**: MetaMask wallet integration (Hedera support disabled)
- **ML**: Python scripts for model processing
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+ (for ML scripts)
- Supabase account
- MetaMask browser extension
- Ethereum Mainnet ETH for transactions

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Ethereum Mainnet Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=your_mainnet_contract_address
NEXT_PUBLIC_ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/your_mainnet_api_key

# Optional: Hedera Configuration (DISABLED - No longer using Hedera)
# NEXT_PUBLIC_HEDERA_NETWORK=testnet
# NEXT_PUBLIC_HEDERA_MIRROR_NODE=https://testnet.mirrornode.hedera.com
```

### 3. Database Setup

Run the SQL commands in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask')), -- 'hedera' removed - no longer using Hedera
  role TEXT DEFAULT 'consumer' CHECK (role IN ('consumer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  model_hash TEXT NOT NULL,
  model_path TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  nft_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  prediction_result TEXT NOT NULL,
  prediction_score DECIMAL(5,4) NOT NULL,
  features_used TEXT NOT NULL CHECK (features_used IN ('manual', 'api')),
  features_data JSONB,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = wallet_address);

CREATE POLICY "Anyone can view active models" ON models
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all models" ON models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.wallet_address = auth.uid()::text
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE wallet_address = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all predictions" ON predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.wallet_address = auth.uid()::text
      AND users.role = 'admin'
    )
  );
```

### 4. Storage Setup

Initialize Supabase storage buckets by running:

```bash
node scripts/init-storage.js
```

Or manually create these buckets in your Supabase dashboard:

- `ml-models` (private)
- `features-uploads` (private)
- `temp-files` (private)

### 5. Python Dependencies

Install Python dependencies for ML scripts:

```bash
pip install pandas numpy scikit-learn requests
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🎯 Usage

### For Users

1. Connect your MetaMask wallet (ensure you're on Ethereum Mainnet)
2. Navigate to the Prediction page
3. Choose between manual feature input or API fetch
4. Make an ETH payment to the smart contract
5. Receive AI predictions

**Important:** This app uses Ethereum Mainnet. Real ETH will be spent on transactions.

### For Admins

1. Access admin dashboard at `/admin`
2. Upload and manage ML models
3. View user analytics and predictions
4. Manage user accounts and roles

## 📁 Project Structure

```
app/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── admin/          # Admin pages
│   │   ├── api/            # API routes
│   │   ├── prediction/     # Prediction page
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── lib/               # Utilities and configs
│   └── types/             # TypeScript types
├── scripts/               # Python ML scripts
├── public/               # Static assets
└── package.json
```

## 🔧 Configuration

### Custom CSS Variables

The application uses a custom design system with CSS variables defined in `globals.css`:

```css
:root {
  --primary-50: #eff6ff;
  --primary-600: #2563eb;
  --secondary-50: #f8fafc;
  --secondary-600: #475569;
  /* ... more variables */
}
```

### Wallet Configuration

- **MetaMask**: Automatically detected if installed (Ethereum Mainnet required)
- **Network Validation**: Ensures users are connected to Ethereum Mainnet
- **Hedera**: Support disabled (no longer using Hedera)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🔮 Roadmap

- [ ] Advanced ML model management
- [ ] Real-time prediction streaming
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] NFT marketplace integration
