#!/bin/bash
set -e

mkdir -p ../../dist
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \
  go build -ldflags="-s -w" -trimpath \
  -o ../../dist/tartarus-agent-linux-amd64 \
  ../main.go

echo "[BUILD] Linux agent built successfully: dist/tartarus-agent-linux-amd64"
