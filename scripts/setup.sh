#!/bin/bash

echo "Checking Node.js version..."
node --version

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Validating Serverless configuration..."
npx serverless print --stage dev > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Serverless configuration is valid"
else
    echo "Serverless configuration has errors"
    exit 1
fi