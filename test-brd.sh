#!/bin/bash
# BRD Feature Test Script - Run from project root
# Usage: bash test-brd.sh
set -e

PREVIEW="https://tsvaga-git-main-fleboho-s-projects.vercel.app"
PASS=0
FAIL=0

check() {
  local name="$1"; local method="$2"; local url="$3"; shift 3
  local code=$(curl -s -o /tmp/resp.txt -w "%{http_code}" --max-time 15 -X "$method" "$url" "$@" 2>/dev/null)
  local body=$(cat /tmp/resp.txt | head -c 200)
  if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
    echo "✅ $name (HTTP $code)"
    PASS=$((PASS+1))
  else
    echo "❌ $name (HTTP $code) - $body"
    FAIL=$((FAIL+1))
  fi
}

echo "============ PUBLIC FEATURES ============"

# 1. Pages load
check "Home page" GET "$PREVIEW/"
check "Search page" GET "$PREVIEW/search"
check "Login page" GET "$PREVIEW/login"
check "Register page" GET "$PREVIEW/register"

# 2. API - Filters
check "API Filters" GET "$PREVIEW/api/items/filters"

# 3. API - Item search
RESP=$(curl -s --max-time 15 "$PREVIEW/api/items?q=wallet")
ITEM_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('items',[])[0]['id'] if d.get('items') else '')" 2>/dev/null)
if [ -n "$RESP" ]; then echo "✅ Item Search (results found)"; PASS=$((PASS+1)); else echo "❌ Item Search (no results)"; FAIL=$((FAIL+1)); fi

# 4. Item Detail
check "Item Detail" GET "$PREVIEW/items/$ITEM_ID"

# 5. Contact form
check "Contact API" POST "$PREVIEW/api/contact" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"$ITEM_ID\",\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Testing\"}"

echo ""
echo "============ AUTH FLOW (User) ============"

# Get CSRF token
CSRF=$(curl -s --max-time 15 -c /tmp/cookies.txt "$PREVIEW/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF" | python3 -c "import json,sys; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
echo "CSRF: $CSRF_TOKEN"

# User login
LOGIN=$(curl -s --max-time 15 -c /tmp/session.txt -b /tmp/cookies.txt \
  -X POST "$PREVIEW/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=user@example.com&password=user123&redirect=false&json=true")
if echo "$LOGIN" | python3 -c "import json,sys; d=json.load(sys.stdin); 0 if d.get('url') else exit(1)" 2>/dev/null; then
  echo "✅ User Login"
  PASS=$((PASS+1))
else
  echo "❌ User Login - $LOGIN"
  FAIL=$((FAIL+1))
fi

# Authenticated user requests
check "User Dashboard" GET "$PREVIEW/dashboard" -b /tmp/session.txt
check "Alerts Page" GET "$PREVIEW/alerts" -b /tmp/session.txt
check "List Alerts API" GET "$PREVIEW/api/alerts" -b /tmp/session.txt

# Create alert
ALERT=$(curl -s --max-time 15 -b /tmp/session.txt \
  -X POST "$PREVIEW/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"test wallet black","categoryId":"","locationId":"","isDocument":false}')
ALERT_ID=$(echo "$ALERT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('alert',{}).get('id',''))" 2>/dev/null)
if [ -n "$ALERT_ID" ]; then echo "✅ Create Alert"; PASS=$((PASS+1)); else echo "❌ Create Alert - $ALERT"; FAIL=$((FAIL+1)); fi

# Update alert
UPDATE=$(curl -s --max-time 15 -b /tmp/session.txt \
  -X PATCH "$PREVIEW/api/alerts/$ALERT_ID" \
  -H "Content-Type: application/json" \
  -d '{"keywords":"test wallet black updated"}')
if [ -n "$UPDATE" ]; then echo "✅ Update Alert"; PASS=$((PASS+1)); else echo "❌ Update Alert"; FAIL=$((FAIL+1)); fi

# Delete alert
DELETE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -b /tmp/session.txt \
  -X DELETE "$PREVIEW/api/alerts/$ALERT_ID")
if [ "$DELETE_CODE" -ge 200 ] && [ "$DELETE_CODE" -lt 400 ]; then echo "✅ Delete Alert"; PASS=$((PASS+1)); else echo "❌ Delete Alert (HTTP $DELETE_CODE)"; FAIL=$((FAIL+1)); fi

echo ""
echo "============ AUTH FLOW (Admin) ============"

# Admin login
CSRF2=$(curl -s --max-time 15 -c /tmp/cookies2.txt "$PREVIEW/api/auth/csrf")
CSRF_TOKEN2=$(echo "$CSRF2" | python3 -c "import json,sys; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
LOGIN2=$(curl -s --max-time 15 -c /tmp/session2.txt -b /tmp/cookies2.txt \
  -X POST "$PREVIEW/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN2&email=admin@lostandfound.com&password=admin123&redirect=false&json=true")
if echo "$LOGIN2" | python3 -c "import json,sys; d=json.load(sys.stdin); 0 if d.get('url') else exit(1)" 2>/dev/null; then
  echo "✅ Admin Login"
  PASS=$((PASS+1))
else
  echo "❌ Admin Login - $LOGIN2"
  FAIL=$((FAIL+1))
fi

check "Admin Dashboard" GET "$PREVIEW/admin/dashboard" -b /tmp/session2.txt
check "Admin Items" GET "$PREVIEW/admin/items" -b /tmp/session2.txt
check "Admin Categories" GET "$PREVIEW/admin/categories" -b /tmp/session2.txt
check "List Items API" GET "$PREVIEW/api/admin/items" -b /tmp/session2.txt

# Create item
ITEM=$(curl -s --max-time 15 -b /tmp/session2.txt \
  -X POST "$PREVIEW/api/admin/items" \
  -H "Content-Type: application/json" \
  -d '{"title":"BRD Test Item","description":"Created during automated BRD testing","category":"","location":""}')
NEW_ID=$(echo "$ITEM" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('item',{}).get('id',''))" 2>/dev/null)
if [ -n "$NEW_ID" ]; then echo "✅ Create Item"; PASS=$((PASS+1)); else echo "❌ Create Item - $ITEM"; FAIL=$((FAIL+1)); fi

# Update item
UPDATE2=$(curl -s --max-time 15 -b /tmp/session2.txt \
  -X PATCH "$PREVIEW/api/admin/items/$NEW_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"BRD Test Item Updated","description":"Updated description"}')
if [ -n "$UPDATE2" ]; then echo "✅ Update Item"; PASS=$((PASS+1)); else echo "❌ Update Item"; FAIL=$((FAIL+1)); fi

# Mark returned
MR_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -b /tmp/session2.txt \
  -X POST "$PREVIEW/api/admin/items/$NEW_ID/mark-returned")
if [ "$MR_CODE" -ge 200 ] && [ "$MR_CODE" -lt 400 ]; then echo "✅ Mark Returned"; PASS=$((PASS+1)); else echo "❌ Mark Returned (HTTP $MR_CODE)"; FAIL=$((FAIL+1)); fi

# Delete item
DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -b /tmp/session2.txt \
  -X DELETE "$PREVIEW/api/admin/items/$NEW_ID")
if [ "$DEL_CODE" -ge 200 ] && [ "$DEL_CODE" -lt 400 ]; then echo "✅ Delete Item"; PASS=$((PASS+1)); else echo "❌ Delete Item (HTTP $DEL_CODE)"; FAIL=$((FAIL+1)); fi

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $((PASS+FAIL)) tests"
