# AuthenBot - AI-Powered Authentication & Chat Application

A modern, full-stack web application built with SvelteKit, featuring AI-powered chat functionality, comprehensive user authentication, and role-based access control.

## 🚀 Features

### 🔐 Authentication System
- **User Registration & Login**: Secure email-based authentication
- **Email Verification**: OTP-based email verification system
- **Password Reset**: Secure password recovery with email codes
- **OAuth Integration**: Google and GitHub OAuth support
- **Session Management**: Robust session handling with Auth.js
- **Role-Based Access**: Admin and regular user roles

### 🤖 AI Chat System
- **AI-Powered Conversations**: Integration with Google Generative AI (Gemini)
- **Chat History**: Persistent chat storage and management
- **Fork Functionality**: Clone and continue conversations
- **Message Streaming**: Real-time AI response streaming
- **Chat Management**: Rename, delete, and organize chats

### 👥 User Management (Admin)
- **User Dashboard**: Comprehensive user overview and statistics
- **Role Management**: Change user roles (admin/user)
- **User Status Control**: Enable/disable user accounts
- **User Search & Filtering**: Advanced user management interface
- **Real-time Updates**: Instant UI updates without page refresh

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, responsive interface
- **Beautiful Sidebar**: Blue gradient sidebar navigation
- **Modern Cards**: Clean, shadowed card design
- **Smooth Animations**: Hover effects and transitions
- **Professional Theme**: Consistent color scheme and typography

## 🛠️ Tech Stack

### Frontend
- **SvelteKit 2.0**: Modern full-stack framework
- **Svelte 5**: Latest Svelte with runes
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe development

### Backend
- **SvelteKit Server**: Server-side rendering and API routes
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Auth.js**: Comprehensive authentication solution

### AI & External Services
- **Google Generative AI**: Gemini API integration
- **Email Services**: SMTP email delivery
- **OAuth Providers**: Google & GitHub authentication

### Development Tools
- **Docker**: Containerized development environment
- **PNPM**: Fast package manager
- **ESLint**: Code quality and consistency

## 📁 Project Structure

```
src/
├── lib/
│   ├── assets/           # Static assets (favicon, images)
│   ├── auth/            # Authentication utilities
│   ├── components/      # Reusable UI components
│   ├── server/          # Server-side utilities
│   │   ├── db/         # Database configuration & schema
│   │   ├── email/      # Email service functions
│   │   └── admin/      # Admin utility functions
│   └── utils/           # General utility functions
├── routes/               # SvelteKit routes
│   ├── +layout.svelte   # Main application layout
│   ├── +layout.server.ts # Layout server logic
│   ├── login/           # Authentication pages
│   ├── verify/          # Email verification
│   ├── forgot-password/ # Password recovery
│   ├── reset/           # Password reset
│   ├── user/            # User dashboard
│   ├── dashboard/       # Admin dashboard
│   ├── admin/           # Admin routes
│   │   └── users/      # User management
│   ├── chat/            # AI chat interface
│   ├── settings/        # User profile & settings
│   └── api/             # API endpoints
│       └── chat/        # Chat API routes
├── app.html              # HTML template
└── app.css              # Global styles
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Docker (optional, for containerized setup)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Authapp
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/authenbot"

# Authentication
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:5173"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. Database Setup
```bash
# Push database schema
pnpm db:push

# Or run migrations
pnpm db:migrate
```

### 5. Start Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## 🐳 Docker Setup

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Setup
```bash
# Build image
docker build -t authenbot .

# Run container
docker run -p 5173:5173 -e DATABASE_URL="your-db-url" authenbot
```

## 🔧 Configuration

### Database Schema
The application uses the following main tables:
- `user`: User accounts and profiles
- `session`: User sessions
- `verificationToken`: Email verification tokens
- `chat`: Chat conversations
- `message`: Individual chat messages

### Authentication Flow
1. **Registration**: User signs up with email verification
2. **Login**: Email/password or OAuth authentication
3. **Verification**: OTP-based email verification
4. **Session**: Database-backed session management with Auth.js
5. **Access Control**: Role-based route protection

### Chat System
- **Message Storage**: Persistent chat history
- **AI Integration**: Google Gemini API for responses
- **Real-time Updates**: Streaming AI responses
- **Chat Management**: Fork, rename, and delete functionality

## 🎯 Usage Guide

### For Regular Users
1. **Sign Up**: Create account with email verification
2. **Login**: Access your personalized dashboard
3. **Chat**: Start conversations with AI
4. **Profile**: Manage your account settings

### For Administrators
1. **Dashboard**: View system statistics and user overview
2. **User Management**: Manage all user accounts
3. **Role Control**: Assign admin/user roles
4. **System Monitoring**: Monitor application usage

### Chat Features
1. **New Chat**: Start fresh conversations
2. **Chat History**: Access previous conversations
3. **Fork Chat**: Clone and continue conversations
4. **AI Responses**: Get intelligent responses from Gemini

## 🔒 Security Features

- **Password Hashing**: Secure password storage
- **Session Management**: Secure session handling
- **CSRF Protection**: Built-in CSRF protection
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting protection
- **OAuth Security**: Secure OAuth implementation

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured interface with sidebar
- **Tablet**: Adaptive layout for medium screens
- **Mobile**: Mobile-first design with touch optimization

## 🚀 Deployment

### Production Build
```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection strings
- Authentication secrets
- API keys for external services
- Email service configuration

### Database Migration
```bash
# Run production migrations
pnpm db:migrate

# Generate migration files
pnpm db:generate
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Linting
```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

## 📊 Performance

- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Optimized image delivery
- **Caching**: Intelligent caching strategies
- **Bundle Optimization**: Minimal bundle sizes

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use Svelte 5 runes syntax
- Maintain consistent code formatting
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Check DATABASE_URL and PostgreSQL status
- **Email Issues**: Verify SMTP credentials and settings
- **OAuth Problems**: Ensure OAuth app configuration is correct
- **Build Errors**: Clear node_modules and reinstall dependencies

### Getting Help
- Check the [Issues](issues) page for known problems
- Review the [Documentation](docs) for detailed guides
- Contact the development team for support

## 🔄 Changelog

### Version 1.0.0
- Initial release with core authentication
- AI chat functionality with Gemini integration
- User management system
- Modern responsive UI
- Role-based access control

## 🙏 Acknowledgments

- **SvelteKit Team**: For the amazing framework
- **Auth.js**: Comprehensive authentication solution
- **Drizzle ORM**: Type-safe database operations
- **Google AI**: Gemini API for intelligent responses
- **Tailwind CSS**: Utility-first CSS framework

---

**Built with ❤️ using modern web technologies**
