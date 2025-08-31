@echo off
echo Creating .env file for your AuthApp project...
echo.

echo # Gemini AI API Configuration > .env

echo GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here >> .env
echo. >> .env
echo # Database Configuration >> .env
echo DATABASE_URL=postgresql://postgres:password@localhost:5433/auth_chat_db >> .env
echo. >> .env
echo # Auth.js secret key >> .env
echo AUTH_SECRET=your_auth_secret_here >> .env
echo. >> .env
echo # Gmail SMTP Settings >> .env
echo SMTP_HOST=smtp.gmail.com >> .env
echo SMTP_PORT=587 >> .env
echo SMTP_USER=your_email@gmail.com >> .env
echo SMTP_PASS=your_app_password_here >> .env
echo SMTP_FROM=your_email@gmail.com >> .env
echo. >> .env
echo # Google OAuth >> .env
echo AUTH_GOOGLE_ID=your_google_oauth_client_id_here >> .env
echo AUTH_GOOGLE_SECRET=your_google_oauth_client_secret_here >> .env
echo. >> .env
echo # GitHub OAuth >> .env
echo AUTH_GITHUB_ID=your_github_oauth_client_id_here >> .env
echo AUTH_GITHUB_SECRET=your_github_oauth_client_secret_here >> .env
echo. >> .env
echo # Application URL >> .env
echo AUTH_URL=http://localhost:5173 >> .env

echo .env file created successfully!
echo.
echo IMPORTANT: Please edit the .env file and replace placeholder values with your actual API keys and secrets.
echo.
echo Now you can run: docker-compose up -d
echo Then: pnpm install
echo Finally: pnpm dev
pause
