#!/bin/bash

# Personal Task Tracker - Docker Deployment Script
# This script helps deploy the application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Docker version
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "Docker version: $DOCKER_VERSION"
    
    # Check Docker Compose version
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "Docker Compose version: $COMPOSE_VERSION"
    
    print_success "Prerequisites check passed!"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            print_status "Creating .env file from env.example..."
            cp env.example .env
            print_warning "Please edit .env file with your configuration before continuing!"
            print_warning "Especially change the JWT_SECRET_KEY and database passwords!"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error "env.example file not found!"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi
}

# Function to build and start services
deploy_production() {
    print_status "Deploying in production mode..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
}

# Function to deploy development
deploy_development() {
    print_status "Deploying in development mode..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Build and start services
    print_status "Building and starting development services..."
    docker-compose -f docker-compose.dev.yml up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health_dev
}

# Function to check health
check_health() {
    print_status "Checking service health..."
    
    # Check frontend
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check backend
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check MySQL
    if docker-compose exec -T mysql mysqladmin ping -h localhost >/dev/null 2>&1; then
        print_success "MySQL is healthy"
    else
        print_warning "MySQL health check failed"
    fi
}

# Function to check health for development
check_health_dev() {
    print_status "Checking development service health..."
    
    # Check backend
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check MySQL
    if docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost >/dev/null 2>&1; then
        print_success "MySQL is healthy"
    else
        print_warning "MySQL health check failed"
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing service logs..."
    docker-compose logs -f
}

# Function to show development logs
show_logs_dev() {
    print_status "Showing development service logs..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to stop development services
stop_services_dev() {
    print_status "Stopping development services..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Development services stopped"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to show development status
show_status_dev() {
    print_status "Development service status:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to show help
show_help() {
    echo "Personal Task Tracker - Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Deploy in production mode"
    echo "  dev             Deploy in development mode"
    echo "  stop            Stop production services"
    echo "  stop-dev        Stop development services"
    echo "  logs            Show production logs"
    echo "  logs-dev        Show development logs"
    echo "  status          Show production service status"
    echo "  status-dev      Show development service status"
    echo "  health          Check production service health"
    echo "  health-dev      Check development service health"
    echo "  cleanup         Stop services and clean up volumes"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy       # Deploy in production"
    echo "  $0 dev          # Deploy in development"
    echo "  $0 logs         # Show production logs"
    echo "  $0 status       # Show service status"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        check_prerequisites
        setup_environment
        deploy_production
        print_success "Production deployment completed!"
        print_status "Frontend: http://localhost"
        print_status "Backend API: http://localhost:8080"
        print_status "API Documentation: http://localhost:8080/swagger"
        ;;
    "dev")
        check_prerequisites
        setup_environment
        deploy_development
        print_success "Development deployment completed!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend API: http://localhost:5000"
        print_status "API Documentation: http://localhost:5000/swagger"
        ;;
    "stop")
        stop_services
        ;;
    "stop-dev")
        stop_services_dev
        ;;
    "logs")
        show_logs
        ;;
    "logs-dev")
        show_logs_dev
        ;;
    "status")
        show_status
        ;;
    "status-dev")
        show_status_dev
        ;;
    "health")
        check_health
        ;;
    "health-dev")
        check_health_dev
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
