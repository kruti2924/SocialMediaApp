#!/bin/bash

# Social Media App Setup Script
echo "🚀 Setting up Social Media Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "⚙️  Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env file"
    echo "⚠️  Please update backend/.env with your MongoDB URI and JWT secret"
else
    echo "✅ backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/env.example frontend/.env
    echo "✅ Created frontend/.env file"
else
    echo "✅ frontend/.env already exists"
fi

# Create uploads directory
mkdir -p backend/uploads
echo "✅ Created uploads directory"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB URI and JWT secret"
echo "2. Get a Hugging Face API token from https://huggingface.co/settings/tokens"
echo "3. Add the token to backend/.env as HUGGING_FACE_API_TOKEN"
echo "4. Start MongoDB service"
echo "5. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "📚 For more information, check the README.md file"
