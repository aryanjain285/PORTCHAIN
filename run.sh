#!/bin/bash

# Function to run Next.js app
run_nextjs() {
    echo "Starting Next.js app..."
    
    npm run dev &
}

# Function to run Flask server
run_flask() {
    echo "Starting Flask server..."
    
    python loadbalancer.py &
}

# Run both applications
run_nextjs
run_flask

# Wait for both processes to finish
wait

echo "Both applications have been stopped."