# 🚀 AuthApp Setup Guide

This guide will help you set up your friend's AuthApp project to run on your local environment with Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- pnpm package manager installed

## 🔧 Step-by-Step Setup

### 1. Create Environment File

Create a new file named `.env` in your project root directory and add the following content:

```env
# Gemini AI API Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/auth_chat_db

# Auth.js secret key (generate a random string)
AUTH_SECRET=your_auth_secret_here

# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com

# Google OAuth
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

# GitHub OAuth
AUTH_GITHUB_ID=your_github_oauth_client_id_here
AUTH_GITHUB_SECRET=your_github_oauth_client_secret_here

# Application URL
AUTH_URL=http://localhost:5173
```

### 2. Start Docker Services

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 3. Install Dependencies

```bash
# Install project dependencies
pnpm install
```

### 4. Setup Database

```bash
# Push database schema to PostgreSQL
pnpm db:push

# Or if you prefer migrations
pnpm db:migrate
```

### 5. Start Development Server

```bash
# Start the development server
pnpm dev
```

## 🌐 Access Points

- **Application**: http://localhost:5173
- **Database**: localhost:5433 (PostgreSQL)
- **Redis**: localhost:6379

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure Docker containers are running: `docker-compose ps`
- Check container logs: `docker-compose logs postgres`
- Verify port 5433 is not blocked by firewall

### Environment Variables
- Ensure `.env` file is in the project root
- Check that all variables are properly set
- Restart the development server after changing `.env`

### Port Conflicts
- If port 5173 is busy, Vite will automatically use the next available port
- If port 5433 is busy, change it in `docker-compose.yml` and update `DATABASE_URL` in `.env`

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v
```

## 📱 Features Available

- ✅ User authentication (email/password + OAuth)
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Chat system with AI integration (Gemini)
- ✅ Admin panel for user management
- ✅ Role-based access control
- ✅ Session management with Redis

## 🚨 Security Notes

- Keep your `.env` file secure and never commit it to version control
- Your API keys and secrets are now configured for local development
- For production, use different credentials and secure environment management

## 🆘 Need Help?

If you encounter any issues:
1. Check the Docker container logs
2. Verify all environment variables are set correctly
3. Ensure ports are not blocked by firewall/antivirus
4. Restart Docker containers and development server

Happy coding! 🎉
