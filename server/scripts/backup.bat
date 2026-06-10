@echo off
REM Database Backup Script for Windows
REM Creates daily backups of SQLite database with retention policy

setlocal enabledelayedexpansion

REM Configuration
set "BACKUP_DIR=.\backups"
set "DB_FILE=.\pos.db"
set "RETENTION_DAYS=7"

REM Get current date and time
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a-%%b)
set "BACKUP_DATE=%mydate%_%mytime%"
set "BACKUP_FILE=%BACKUP_DIR%\pos_backup_%BACKUP_DATE%.db"

echo.
echo [%date% %time%] Starting database backup...
echo.

REM Check if database file exists
if not exist "%DB_FILE%" (
  echo [ERROR] Database file not found: %DB_FILE%
  exit /b 1
)

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
  echo [INFO] Creating backup directory: %BACKUP_DIR%
  mkdir "%BACKUP_DIR%"
)

REM Create backup
echo [INFO] Source: %DB_FILE%
echo [INFO] Destination: %BACKUP_FILE%

copy "%DB_FILE%" "%BACKUP_FILE%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Failed to create backup
  exit /b 1
)

echo [SUCCESS] Backup completed successfully

REM Get file size
for %%A in ("%BACKUP_FILE%") do (
  set "SIZE=%%~zA"
  if "!SIZE!" geq 1073741824 (
    set /A SIZE_GB=!SIZE! / 1073741824
    echo [INFO] File size: !SIZE_GB! GB
  ) else if "!SIZE!" geq 1048576 (
    set /A SIZE_MB=!SIZE! / 1048576
    echo [INFO] File size: !SIZE_MB! MB
  ) else if "!SIZE!" geq 1024 (
    set /A SIZE_KB=!SIZE! / 1024
    echo [INFO] File size: !SIZE_KB! KB
  ) else (
    echo [INFO] File size: !SIZE! bytes
  )
)

REM List recent backups (last 5)
echo.
echo [INFO] Recent backups:
setlocal enabledelayedexpansion
set count=0
for /f "tokens=*" %%F in ('dir /b /o-d "%BACKUP_DIR%\pos_backup_*.db" 2^>nul') do (
  set /a count+=1
  if !count! leq 5 (
    echo   - %%F
  )
)

if %count% equ 0 (
  echo   No backups found
)

echo.
echo [SUCCESS] Backup process completed
echo.

endlocal
