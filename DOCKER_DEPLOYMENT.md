# Docker Deployment Guide

This guide will help you deploy the Personal Task Tracker application using Docker containers.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 2GB RAM available
- Ports 80, 8080, 3306, 6379 available

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repository>
cd personal_task_tracker/Project
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=logsdb
MYSQL_USER=tasktracker_user
MYSQL_PASSWORD=your_secure_user_password_here

# JWT Configuration (IMPORTANT: Change this!)
JWT_SECRET_KEY=your_very_long_and_secure_jwt_secret_key_here_at_least_32_characters

# API Keys (Optional - for AI and Weather features)
REACT_APP_GEMINI_API_KEY=your_google_gemini_api_key_here
REACT_APP_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 3. Production Deployment

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Development Deployment

```bash
# For development with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Services

### Frontend (React + Nginx)
- **Port**: 80 (HTTP)
- **URL**: http://localhost
- **Features**: 
  - React application with AI Task Manager
  - Nginx reverse proxy
  - Static file serving with caching
  - API proxy to backend

### Backend (.NET 8 API)
- **Port**: 8080
- **URL**: http://localhost:8080
- **Features**:
  - RESTful API
  - JWT Authentication
  - Entity Framework with MySQL
  - Swagger documentation at `/swagger`

### Database (MySQL 8.0)
- **Port**: 3306
- **Database**: logsdb
- **Features**:
  - Persistent data storage
  - Health checks
  - Automatic initialization

### Cache (Redis - Optional)
- **Port**: 6379
- **Features**:
  - Session storage
  - Caching layer

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `tasktracker_root_password` |
| `MYSQL_DATABASE` | Database name | `logsdb` |
| `MYSQL_USER` | Database user | `tasktracker_user` |
| `MYSQL_PASSWORD` | Database password | `tasktracker_password` |
| `JWT_SECRET_KEY` | JWT signing key | `YourGeneratedSecretKeyHmmmmm` |
| `JWT_ISSUER` | JWT issuer | `PersonalTaskTracker` |
| `JWT_AUDIENCE` | JWT audience | `PersonalTaskTrackerUsers` |
| `JWT_EXPIRY_HOURS` | Token expiry hours | `24` |
| `REACT_APP_GEMINI_API_KEY` | Google Gemini API key | - |
| `REACT_APP_OPENWEATHER_API_KEY` | OpenWeather API key | - |

### API Keys Setup

#### Google Gemini API (for AI features)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `REACT_APP_GEMINI_API_KEY`

#### OpenWeather API (for weather features)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up and get your API key
3. Add it to your `.env` file as `REACT_APP_OPENWEATHER_API_KEY`

## Management Commands

### Start Services
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Services
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Database Management
```bash
# Access MySQL shell
docker-compose exec mysql mysql -u root -p

# Backup database
docker-compose exec mysql mysqldump -u root -p logsdb > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p logsdb < backup.sql
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost/health          # Frontend
curl http://localhost:8080/health     # Backend
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :80
netstat -tulpn | grep :8080

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Issues
```bash
# Check MySQL logs
docker-compose logs mysql

# Verify database is ready
docker-compose exec mysql mysqladmin ping -h localhost
```

#### 3. Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Verify nginx configuration
docker-compose exec frontend nginx -t
```

#### 4. Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Verify database migrations
docker-compose exec backend dotnet ef database update
```

### Performance Optimization

#### 1. Resource Limits
Add resource limits to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

#### 2. Database Optimization
```bash
# Optimize MySQL settings
docker-compose exec mysql mysql -u root -p -e "SET GLOBAL innodb_buffer_pool_size = 256M;"
```

## Security Considerations

### 1. Change Default Passwords
- Update `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD`
- Generate a strong `JWT_SECRET_KEY` (at least 32 characters)

### 2. Network Security
- Use Docker networks for service communication
- Expose only necessary ports
- Consider using a reverse proxy (nginx/traefik) for SSL termination

### 3. Data Persistence
- Database data is persisted in Docker volumes
- Regular backups recommended
- Consider using external database for production

## Monitoring

### 1. Log Monitoring
```bash
# Follow all logs
docker-compose logs -f

# Log rotation (add to crontab)
0 0 * * * docker-compose logs --tail=1000 > /var/log/tasktracker/$(date +\%Y\%m\%d).log
```

### 2. Resource Monitoring
```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

## Backup and Recovery

### 1. Database Backup
```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p logsdb > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u root -p logsdb > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 2. Full System Backup
```bash
# Backup volumes
docker run --rm -v tasktracker_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_$(date +%Y%m%d).tar.gz -C /data .
```

## Scaling

### 1. Horizontal Scaling
```yaml
# Scale backend services
docker-compose up -d --scale backend=3

# Use load balancer (nginx/traefik)
```

### 2. Database Scaling
- Consider MySQL master-slave setup
- Use connection pooling
- Implement read replicas for heavy read workloads

## Support

For issues and questions:
1. Check the logs: `docker-compose logs -f`
2. Verify configuration in `.env` file
3. Ensure all prerequisites are met
4. Check Docker and Docker Compose versions

## Features Included

✅ **AI Task Manager** - Intelligent task categorization and suggestions  
✅ **Weather Integration** - Weather-based task recommendations  
✅ **Voice Commands** - Voice-controlled task management  
✅ **Focus Mode** - Pomodoro-style focus sessions  
✅ **Task Analytics** - Comprehensive task analytics and reporting  
✅ **User Authentication** - JWT-based secure authentication  
✅ **Responsive Design** - Mobile-friendly interface  
✅ **Real-time Updates** - Live task updates and notifications  
✅ **Database Persistence** - MySQL with Entity Framework  
✅ **Production Ready** - Optimized Docker containers with health checks
