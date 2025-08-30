@echo off
echo Creating .env file for your AuthApp project...
echo.

echo # Gemini AI API Configuration > .env
echo GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAWE3XZijRYg5tMYPFY1gwftO1a6GOvIH4 >> .env
echo. >> .env
echo # Database Configuration >> .env
echo DATABASE_URL=postgresql://postgres:password@localhost:5433/auth_chat_db >> .env
echo. >> .env
echo # Auth.js secret key >> .env
echo AUTH_SECRET=a13be5ab38156909fe0b1886271bf5fc2d514d78f85418d5aa67c7614ca4d2f8 >> .env
echo. >> .env
echo # Gmail SMTP Settings >> .env
echo SMTP_HOST=smtp.gmail.com >> .env
echo SMTP_PORT=587 >> .env
echo SMTP_USER=muhammadfaseeh565@gmail.com >> .env
echo SMTP_PASS=fsmj lzvv rrjs mqnu >> .env
echo SMTP_FROM=muhammadfaseeh565@gmail.com >> .env
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
echo Now you can run: docker-compose up -d
echo Then: pnpm install
echo Finally: pnpm dev
pause
