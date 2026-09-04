@echo off
title Push Triggy to GitHub
cd /d "C:\xampp\htdocs\triggy"
echo ===================================================================
echo   Pushing Complete Triggy Platform to GitHub
echo   Repository: https://github.com/HettPatell/triggy
echo ===================================================================
echo.
echo Adding and committing latest changes...
git add -A
git commit -m "Update Triggy with latest fixes"
echo.
echo Uploading all folders (assets, css, js, api, config)...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Everything has been successfully uploaded to GitHub!
    echo Vercel will automatically redeploy your site with full CSS and images.
) else (
    echo [NOTICE] If a browser window opened, please click "Authorize" to complete the upload.
)
echo.
pause
