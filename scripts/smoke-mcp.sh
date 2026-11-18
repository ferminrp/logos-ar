#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:4321}"
BASE_URL="${BASE_URL%/}"

json_post() {
  local path="$1"
  local body="$2"
  curl -fsS -X POST "${BASE_URL}${path}" \
    -H 'Content-Type: application/json' \
    -d "${body}"
}

echo "== discovery =="
curl -fsS -o /dev/null -w "llms.txt %{http_code}\n" "${BASE_URL}/llms.txt"
curl -fsS -o /dev/null -w "well-known mcp.json %{http_code}\n" "${BASE_URL}/.well-known/mcp.json"
curl -fsS -o /dev/null -w "well-known mcp %{http_code}\n" "${BASE_URL}/.well-known/mcp"

echo "== initialize =="
json_post /mcp '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' \
  | tee /tmp/mcp-init.json | grep -q '"protocolVersion"'

echo "== tools/list =="
json_post /mcp '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | tee /tmp/mcp-tools.json | grep -q search_logos

call_tool() {
  local name="$1"
  local args="$2"
  json_post /mcp "{\"jsonrpc\":\"2.0\",\"id\":\"${name}\",\"method\":\"tools/call\",\"params\":{\"name\":\"${name}\",\"arguments\":${args}}}"
}

echo "== tools/call search_logos =="
call_tool search_logos '{"query":"galicia","limit":3}' | grep -q galicia

echo "== tools/call get_logo =="
call_tool get_logo '{"slug":"banco-galicia"}' | grep -q '/api/logo-download'

echo "== tools/call list_categories =="
call_tool list_categories '{}' | grep -q bancos

echo "== tools/call list_by_category =="
call_tool list_by_category '{"category":"bancos","limit":3}' | grep -q categoryId

echo "== api/logos unchanged shape =="
curl -fsS "${BASE_URL}/api/logos?q=galicia&limit=1" | grep -q '"items"'

echo "OK smoke against ${BASE_URL}"