@echo off
echo ========================================
echo PartyHaus Flutter App Testing Script
echo ========================================
echo.

echo Checking Flutter installation...
flutter doctor

echo.
echo ========================================
echo Installing dependencies...
echo ========================================
flutter pub get

echo.
echo ========================================
echo Running code analysis...
echo ========================================
flutter analyze

echo.
echo ========================================
echo Testing complete! 
echo Ready to run: flutter run
echo ========================================
pause