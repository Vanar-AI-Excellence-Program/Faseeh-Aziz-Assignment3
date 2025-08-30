# PowerShell script to update .env file for OpenAI priority
# Run this script to comment out AI Gateway variables and prioritize OpenAI

Write-Host "🔄 Updating .env file to prioritize OpenAI..." -ForegroundColor Yellow

# Read the current .env file
$envPath = ".env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    
    # Comment out AI Gateway variables
    $content = $content -replace '^AI_GATEWAY_API_KEY=', '# AI_GATEWAY_API_KEY='
    $content = $content -replace '^AI_GATEWAY_URL=', '# AI_GATEWAY_URL='
    
    # Ensure OpenAI variables are active
    if ($content -notmatch '^OPENAI_API_KEY=') {
        Write-Host "⚠️  Warning: OPENAI_API_KEY not found in .env file" -ForegroundColor Red
        Write-Host "   Please add your OpenAI API key manually:" -ForegroundColor Yellow
        Write-Host "   OPENAI_API_KEY=sk-proj-..." -ForegroundColor Cyan
    } else {
        Write-Host "✅ OPENAI_API_KEY is already configured" -ForegroundColor Green
    }
    
    # Ensure Google Gemini is available as fallback
    if ($content -notmatch '^GOOGLE_GENERATIVE_AI_API_KEY=') {
        Write-Host "⚠️  Warning: GOOGLE_GENERATIVE_AI_API_KEY not found in .env file" -ForegroundColor Red
        Write-Host "   Please add your Google Gemini API key manually:" -ForegroundColor Yellow
        Write-Host "   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy..." -ForegroundColor Cyan
    } else {
        Write-Host "✅ GOOGLE_GENERATIVE_AI_API_KEY is already configured" -ForegroundColor Green
    }
    
    # Write the updated content back
    Set-Content $envPath $content -NoNewline
    Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
    Write-Host "   AI Gateway variables have been commented out" -ForegroundColor Cyan
    Write-Host "   OpenAI is now the primary AI provider" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create a .env file with the following variables:" -ForegroundColor Yellow
    Write-Host "   OPENAI_API_KEY=sk-proj-..." -ForegroundColor Cyan
    Write-Host "   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy..." -ForegroundColor Cyan
    Write-Host "   # AI_GATEWAY_API_KEY=... (commented out)" -ForegroundColor Gray
    Write-Host "   # AI_GATEWAY_URL=... (commented out)" -ForegroundColor Gray
}

Write-Host "`n🚀 Next steps:" -ForegroundColor Green
Write-Host "   1. Restart your development server" -ForegroundColor White
Write-Host "   2. Test the chatbot - it should now use OpenAI directly!" -ForegroundColor White
Write-Host "   3. If OpenAI fails, it will fall back to Google Gemini" -ForegroundColor White
