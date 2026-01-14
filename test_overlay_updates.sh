#!/bin/bash

echo "Testing Video Template Overlay Updates and Aspect Ratio Change"
echo "=============================================================="

# Get the backend URL
BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"

echo ""
echo "1. Testing backend health..."
curl -s "${BACKEND_URL}/api/health" | head -5
echo ""

echo "2. Checking if video templates exist..."
TEMPLATES=$(curl -s "${BACKEND_URL}/api/video-templates" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")
echo "Found ${TEMPLATES} templates"

if [ "$TEMPLATES" -gt 0 ]; then
    echo ""
    echo "3. Getting first template ID..."
    TEMPLATE_ID=$(curl -s "${BACKEND_URL}/api/video-templates" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')")
    echo "Template ID: ${TEMPLATE_ID}"
    
    if [ -n "$TEMPLATE_ID" ]; then
        echo ""
        echo "4. Getting template details..."
        curl -s "${BACKEND_URL}/api/video-templates/${TEMPLATE_ID}" | python3 -m json.tool | head -30
        
        echo ""
        echo "5. Checking overlay count..."
        OVERLAY_COUNT=$(curl -s "${BACKEND_URL}/api/video-templates/${TEMPLATE_ID}" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('text_overlays', [])))")
        echo "Template has ${OVERLAY_COUNT} overlays"
    fi
else
    echo "No templates found. Please create a template first."
fi

echo ""
echo "Test complete!"
