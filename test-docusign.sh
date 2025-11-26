#!/bin/bash

# DocuSign Integration Test Script
# This script helps you test the DocuSign integration

echo "🧪 DocuSign Integration Test Script"
echo "===================================="
echo ""

# Configuration
API_URL="http://localhost:4000/api/v1"
LOAD_ID=""  # Replace with your test load ID
JWT_TOKEN=""  # Replace with your JWT token

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if variables are set
if [ -z "$LOAD_ID" ]; then
    echo -e "${RED}❌ Error: LOAD_ID is not set${NC}"
    echo "Please edit this script and set LOAD_ID to your test load ID"
    exit 1
fi

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ Error: JWT_TOKEN is not set${NC}"
    echo "Please edit this script and set JWT_TOKEN to your authentication token"
    exit 1
fi

echo -e "${YELLOW}📋 Test Configuration:${NC}"
echo "API URL: $API_URL"
echo "Load ID: $LOAD_ID"
echo ""

# Test 1: Send for Signature
echo -e "${YELLOW}Test 1: Sending rate confirmation for signature...${NC}"
SEND_RESPONSE=$(curl -s -X POST "$API_URL/loads/$LOAD_ID/send-for-signature" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "$SEND_RESPONSE" | jq '.'

if echo "$SEND_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    ENVELOPE_ID=$(echo "$SEND_RESPONSE" | jq -r '.data.envelopeId')
    echo -e "${GREEN}✅ Success! Envelope ID: $ENVELOPE_ID${NC}"
    echo ""
    echo -e "${YELLOW}📧 Check the carrier's email for DocuSign notification${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to send for signature${NC}"
    exit 1
fi

# Wait for user to sign
echo -e "${YELLOW}⏳ Please sign the document in DocuSign, then press Enter to continue...${NC}"
read -r

# Test 2: Check Signature Status
echo ""
echo -e "${YELLOW}Test 2: Checking signature status...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/loads/$LOAD_ID/signature-status" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$STATUS_RESPONSE" | jq '.'

if echo "$STATUS_RESPONSE" | jq -e '.data.status' > /dev/null 2>&1; then
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
    echo -e "${GREEN}✅ Current Status: $STATUS${NC}"
    
    if [ "$STATUS" = "completed" ]; then
        SIGNED_URL=$(echo "$STATUS_RESPONSE" | jq -r '.data.signedDocumentUrl')
        echo -e "${GREEN}✅ Document signed and stored at: $SIGNED_URL${NC}"
    fi
else
    echo -e "${RED}❌ Failed to get signature status${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Testing complete!${NC}"
