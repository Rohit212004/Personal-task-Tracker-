@echo off
setlocal enabledelayedexpansion

REM Personal Task Tracker - Docker Deployment Script for Windows
REM This script helps deploy the application using Docker

echo.
echo ========================================
echo Personal Task Tracker - Docker Deploy
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop first
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed or not in PATH
    echo Please install Docker Compose first
    pause
    exit /b 1
)

echo [INFO] Docker and Docker Compose are available

REM Check if .env file exists
if not exist .env (
    if exist env.example (
        echo [INFO] Creating .env file from env.example...
        copy env.example .env >nul
        echo [WARNING] Please edit .env file with your configuration!
        echo [WARNING] Especially change the JWT_SECRET_KEY and database passwords!
        pause
    ) else (
        echo [ERROR] env.example file not found!
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] .env file already exists
)

REM Parse command line argument
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=help

if "%COMMAND%"=="deploy" goto deploy_production
if "%COMMAND%"=="dev" goto deploy_development
if "%COMMAND%"=="stop" goto stop_services
if "%COMMAND%"=="stop-dev" goto stop_services_dev
if "%COMMAND%"=="logs" goto show_logs
if "%COMMAND%"=="logs-dev" goto show_logs_dev
if "%COMMAND%"=="status" goto show_status
if "%COMMAND%"=="status-dev" goto show_status_dev
if "%COMMAND%"=="health" goto check_health
if "%COMMAND%"=="health-dev" goto check_health_dev
if "%COMMAND%"=="cleanup" goto cleanup
goto show_help

:deploy_production
echo [INFO] Deploying in production mode...
echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1
echo [INFO] Building and starting services...
docker-compose up -d --build
echo [INFO] Waiting for services to be healthy...
timeout /t 30 /nobreak >nul
call :check_health
echo.
echo [SUCCESS] Production deployment completed!
echo [INFO] Frontend: http://localhost
echo [INFO] Backend API: http://localhost:8080
echo [INFO] API Documentation: http://localhost:8080/swagger
goto end

:deploy_development
echo [INFO] Deploying in development mode...
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.dev.yml down >nul 2>&1
echo [INFO] Building and starting development services...
docker-compose -f docker-compose.dev.yml up -d --build
echo [INFO] Waiting for services to be healthy...
timeout /t 30 /nobreak >nul
call :check_health_dev
echo.
echo [SUCCESS] Development deployment completed!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend API: http://localhost:5000
echo [INFO] API Documentation: http://localhost:5000/swagger
goto end

:stop_services
echo [INFO] Stopping production services...
docker-compose down
echo [SUCCESS] Services stopped
goto end

:stop_services_dev
echo [INFO] Stopping development services...
docker-compose -f docker-compose.dev.yml down
echo [SUCCESS] Development services stopped
goto end

:show_logs
echo [INFO] Showing production service logs...
docker-compose logs -f
goto end

:show_logs_dev
echo [INFO] Showing development service logs...
docker-compose -f docker-compose.dev.yml logs -f
goto end

:show_status
echo [INFO] Production service status:
docker-compose ps
goto end

:show_status_dev
echo [INFO] Development service status:
docker-compose -f docker-compose.dev.yml ps
goto end

:check_health
echo [INFO] Checking production service health...
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend health check failed
) else (
    echo [SUCCESS] Frontend is healthy
)

curl -f http://localhost:8080/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend health check failed
) else (
    echo [SUCCESS] Backend is healthy
)

docker-compose exec -T mysql mysqladmin ping -h localhost >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MySQL health check failed
) else (
    echo [SUCCESS] MySQL is healthy
)
goto end

:check_health_dev
echo [INFO] Checking development service health...
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend health check failed
) else (
    echo [SUCCESS] Backend is healthy
)

docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MySQL health check failed
) else (
    echo [SUCCESS] MySQL is healthy
)
goto end

:cleanup
echo [INFO] Cleaning up...
docker-compose down -v
docker system prune -f
echo [SUCCESS] Cleanup completed
goto end

:show_help
echo Personal Task Tracker - Docker Deployment Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   deploy          Deploy in production mode
echo   dev             Deploy in development mode
echo   stop            Stop production services
echo   stop-dev        Stop development services
echo   logs            Show production logs
echo   logs-dev        Show development logs
echo   status          Show production service status
echo   status-dev      Show development service status
echo   health          Check production service health
echo   health-dev      Check development service health
echo   cleanup         Stop services and clean up volumes
echo   help            Show this help message
echo.
echo Examples:
echo   %0 deploy       # Deploy in production
echo   %0 dev          # Deploy in development
echo   %0 logs         # Show production logs
echo   %0 status       # Show service status
goto end

:end
echo.
pause
