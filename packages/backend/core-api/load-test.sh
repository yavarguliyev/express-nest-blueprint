#!/bin/bash

# Load Testing Scripts for Express-Nest-Blueprint API
# Usage: bash load-test.sh <test-name>
# Example: bash load-test.sh auth-login

set -e

# Base configuration
BASE_URL="http://127.0.0.1:3000"
DURATION=10
CONNECTIONS=120
WORKERS=8

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
print_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Test cases
case "${1:-help}" in
    
    # ========================================
    # Authentication Tests
    # ========================================
    
    auth-register)
        print_info "Testing: User Registration"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -b '{
                "email": "loadtest@example.com",
                "password": "Test@12345",
                "firstName": "Load",
                "lastName": "Test"
            }' \
            "${BASE_URL}/api/v1/auth/register"
        ;;
    
    auth-login)
        print_info "Testing: User Login"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -b '{
                "email": "guliyev.yavar@example.com",
                "password": "StrongPassword@123"
            }' \
            "${BASE_URL}/api/v1/auth/login"
        ;;
    
    auth-refresh)
        print_warn "Replace YOUR_REFRESH_TOKEN with actual refresh token"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -b '{
                "refreshToken": "YOUR_REFRESH_TOKEN"
            }' \
            "${BASE_URL}/api/v1/auth/refresh"
        ;;
    
    # ========================================
    # User CRUD Tests
    # ========================================
    
    users-list)
        print_warn "Replace YOUR_JWT_TOKEN with actual bearer token"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "Accept: application/json" \
            -H "Authorization: Bearer YOUR_JWT_TOKEN" \
            "${BASE_URL}/api/v1/users"
        ;;
    
    users-create)
        print_warn "Replace YOUR_JWT_TOKEN with actual bearer token"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer YOUR_JWT_TOKEN" \
            -b '{
                "email": "newuser@example.com",
                "password": "Test@12345",
                "firstName": "New",
                "lastName": "User",
                "role": "user"
            }' \
            "${BASE_URL}/api/v1/users"
        ;;
    
    users-get)
        print_warn "Replace YOUR_JWT_TOKEN and USER_ID"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "Accept: application/json" \
            -H "Authorization: Bearer YOUR_JWT_TOKEN" \
            "${BASE_URL}/api/v1/users/1"
        ;;
    
    users-update)
        print_warn "Replace YOUR_JWT_TOKEN and USER_ID"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m PUT \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer YOUR_JWT_TOKEN" \
            -b '{
                "firstName": "Updated",
                "lastName": "Name"
            }' \
            "${BASE_URL}/api/v1/users/1"
        ;;
    
    # ========================================
    # Admin Bulk Operations Test
    # ========================================
    
    admin-bulk)
        print_warn "Replace YOUR_JWT_TOKEN and USER_ID with actual admin bearer token"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m POST \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiZ3VsaXlldi55YXZhckBleGFtcGxlLmNvbSIsInJvbGUiOiJnbG9iYWwgYWRtaW4iLCJpYXQiOjE3NzEwNjA1ODIsImV4cCI6MTc3MTE0Njk4Mn0.mm-DfmVQDlWZYvJWnkyaQRpKtVMhmC0J07bCoz7h2WA" \
            -b '{
                "operations": [
                    {"type":"update","table":"users","category":"Database Management","recordId":3,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":4,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":5,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":6,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":7,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":8,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":9,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":10,"data":{"isActive":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":3,"data":{"isEmailVerified":true}},
                    {"type":"update","table":"users","category":"Database Management","recordId":4,"data":{"isEmailVerified":true}}
                ]
            }' \
            "${BASE_URL}/api/v1/admin/bulk-operations"
        ;;
    
    # ========================================
    # Health & Metrics Tests
    # ========================================
    
    health-live)
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "X-Health-Key: your_super_secret_jwt_key" \
            "${BASE_URL}/api/v1/health/live"
        ;;
    
    health-ready)
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "X-Health-Key: your_super_secret_jwt_key" \
            "${BASE_URL}/api/v1/health/ready"
        ;;
    
    metrics)
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "X-Health-Key: your_super_secret_jwt_key" \
            "${BASE_URL}/api/v1/metrics"
        ;;
    
    # ========================================
    # File Upload Test
    # ========================================
    
    upload)
        print_error "File upload tests require multipart/form-data - use manual autocannon or Postman"
        print_info "Example command:"
        echo "autocannon -c 10 -d 30 -m POST -H 'Authorization: Bearer YOUR_JWT_TOKEN' ${BASE_URL}/api/v1/upload"
        ;;
    
    # ========================================
    # Custom Test
    # ========================================
    
    custom)
        print_info "Running custom test configuration"
        print_warn "Modify the parameters below in the script as needed"
        autocannon \
            --workers $WORKERS \
            -c $CONNECTIONS \
            -d $DURATION \
            --renderStatusCodes \
            --renderLatencyTable \
            -m GET \
            -H "Authorization: Bearer YOUR_JWT_TOKEN" \
            "${BASE_URL}/api/v1/your-endpoint"
        ;;
    
    # ========================================
    # Help
    # ========================================
    
    help|*)
        echo ""
        echo "🚀 Load Testing Scripts for Express-Nest-Blueprint API"
        echo ""
        echo "Usage: bash load-test.sh <test-name>"
        echo ""
        echo "Available tests:"
        echo "  Authentication:"
        echo "    auth-register    - POST /api/v1/auth/register"
        echo "    auth-login       - POST /api/v1/auth/login"
        echo "    auth-refresh     - POST /api/v1/auth/refresh"
        echo ""
        echo "  Users:"
        echo "    users-list       - GET /api/v1/users"
        echo "    users-create     - POST /api/v1/users"
        echo "    users-get        - GET /api/v1/users/:id"
        echo "    users-update     - PUT /api/v1/users/:id"
        echo ""
        echo "  Admin:"
        echo "    admin-bulk       - POST /api/v1/admin/bulk-operations"
        echo ""
        echo "  Health & Monitoring:"
        echo "    health-live      - GET /api/v1/health/live"
        echo "    health-ready     - GET /api/v1/health/ready"
        echo "    metrics          - GET /api/v1/metrics"
        echo ""
        echo "  Other:"
        echo "    custom           - Run custom test (edit script)"
        echo ""
        echo "Configuration:"
        echo "  Base URL:     ${BASE_URL}"
        echo "  Duration:     ${DURATION}s"
        echo "  Connections:  ${CONNECTIONS}"
        echo "  Workers:      ${WORKERS}"
        echo ""
        echo "Example:"
        echo "  bash load-test.sh auth-login"
        echo ""
        ;;
esac
