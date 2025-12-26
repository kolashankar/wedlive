#!/bin/bash

# WedLive API - Endpoint Test Runner
# This script runs the comprehensive endpoint test suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"
TEST_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/test_endpoints.py"
BASE_URL="${BASE_URL:-http://localhost:8001}"
PYTHON_CMD="${PYTHON_CMD:-python3}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WedLive API - Endpoint Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Python is installed
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python found: $($PYTHON_CMD --version)${NC}"
echo ""

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Error: Test file not found at $TEST_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test file found${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running at $BASE_URL...${NC}"
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Backend is not running at $BASE_URL${NC}"
    echo -e "${YELLOW}Please start the backend with:${NC}"
    echo -e "${BLUE}cd $BACKEND_DIR && python -m uvicorn server:app --reload${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Run the tests
echo -e "${BLUE}Starting endpoint tests...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

$PYTHON_CMD "$TEST_FILE"

exit_code=$?

echo ""
echo -e "${BLUE}========================================${NC}"

if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${RED}Some tests failed. Check output above for details.${NC}"
fi

echo -e "${BLUE}========================================${NC}"

exit $exit_code
