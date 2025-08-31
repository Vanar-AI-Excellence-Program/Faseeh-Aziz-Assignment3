# PowerShell script to create .env file
Write-Host "Creating .env file for your AuthApp project..." -ForegroundColor Green
Write-Host ""

$envContent = @"
# Gemini AI API Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/local

# Auth.js secret key
AUTH_SECRET=your_auth_secret_here

# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com

# Google OAuth
AUTH_GOOGLE_ID=your_google_oauth_client_id_here
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret_here

# GitHub OAuth
AUTH_GITHUB_ID=your_github_oauth_client_id_here
AUTH_GITHUB_SECRET=your_github_oauth_client_secret_here

# Application URL
AUTH_URL=http://localhost:5173
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ".env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Please edit the .env file and replace placeholder values with your actual API keys and secrets." -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Docker services: docker-compose up -d" -ForegroundColor Cyan
Write-Host "2. Install dependencies: pnpm install" -ForegroundColor Cyan
Write-Host "3. Push database schema: pnpm db:push" -ForegroundColor Cyan
Write-Host "4. Start development server: pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
