#!/bin/bash
set -e

mkdir -p ../../dist
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 \
  go build -ldflags="-s -w" -trimpath \
  -o ../../dist/tartarus-agent-windows-amd64.exe \
  ../main.go

echo "[BUILD] Windows agent built successfully: dist/tartarus-agent-windows-amd64.exe"
