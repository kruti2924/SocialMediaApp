# Social Media Application

A full-stack social media application with AI-powered post generation capabilities. Create posts, follow users, send messages, and generate stunning images from text descriptions using AI.

## ✨ Features

### 🔐 User Authentication
- JWT-based registration and login
- Secure password hashing with bcrypt
- Profile management with bio and profile pictures
- Online/offline status tracking

### 📝 Post System
- Create, edit, and delete posts
- Like and unlike posts
- Comment on posts
- Text-only posts (like tweets)
- Infinite scroll feed with pagination

### 🎨 AI Image Generation
- Convert text descriptions to images using Hugging Face API
- Customizable generation parameters (steps, guidance scale)
- Download generated images
- Integration with posts (can attach generated images)

### 👥 Social Features
- Follow/unfollow users
- View followers and following lists
- User profile pages with posts
- Search users by username
- Real-time online status

### 💬 Messaging System
- Direct messaging between users
- Group messaging with multiple participants
- Real-time message delivery with Socket.io
- Message history with pagination
- Read receipts and message status

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **AI Integration**: Hugging Face API
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Hugging Face account and API token

### 1. Clone and Setup
```bash
git clone <repository-url>
cd social-media-app
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment Variables

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
HUGGING_FACE_API_TOKEN=your-hugging-face-api-token-here
PORT=5000
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Get Hugging Face API Token
1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token
3. Add it to your `backend/.env` file

### 4. Start the Application
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
social-media-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Socket)
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions and API
│   │   └── main.jsx       # App entry point
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Node.js backend API
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js          # Server entry point
│   └── package.json
├── package.json            # Root package.json for scripts
├── setup.sh               # Setup script
└── README.md              # This file
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Posts Endpoints
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment to post
- `GET /api/posts/user/:userId` - Get posts by specific user

### Users Endpoints
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get user's followers
- `GET /api/users/:id/following` - Get users that this user follows
- `GET /api/users/search/:query` - Search users by username

### Messages Endpoints
- `GET /api/messages/conversations` - Get user's conversations
- `POST /api/messages/conversations` - Create new conversation
- `GET /api/messages/:conversationId` - Get messages in conversation
- `POST /api/messages` - Send message
- `PUT /api/messages/:messageId/read` - Mark message as read
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message

### AI Generation Endpoints
- `POST /api/generate/image` - Generate image from text
- `POST /api/generate/validate-prompt` - Validate prompt before generation
- `GET /api/generate/models` - Get available generation models

## 🔧 Development

### Available Scripts

**Root level:**
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run install-all` - Install dependencies for all projects
- `npm run build` - Build frontend for production

**Backend:**
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database Schema

**User Model:**
- username, email, password (hashed)
- bio, profilePicture
- followers[], following[]
- isOnline, lastSeen

**Post Model:**
- content, author (ref to User)
- image, isGeneratedImage, generationPrompt
- likes[], comments[]
- isEdited, timestamps

**Conversation Model:**
- participants[] (ref to User)
- isGroup, groupName, groupDescription
- lastMessage (ref to Message)
- lastActivity

**Message Model:**
- conversation (ref to Conversation)
- sender (ref to User)
- content, messageType, attachments[]
- isRead[], replyTo (ref to Message)
- isEdited, timestamps

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start the server
3. Use PM2 or similar for process management
4. Set up reverse proxy with Nginx

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve static files with Nginx or CDN
3. Configure API URL for production

### Database
- Use MongoDB Atlas for cloud deployment
- Set up proper indexes for performance
- Configure backup and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI image generation API
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for frontend
- [Express.js](https://expressjs.com/) and [MongoDB](https://mongodb.com/) for backend
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Socket.io](https://socket.io/) for real-time features
