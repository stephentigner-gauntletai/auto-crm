#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: $0 [up|down|new <name>|reset]"
    echo "  up        - Apply all pending migrations"
    echo "  down      - Revert last migration"
    echo "  new       - Create a new migration file"
    echo "  reset     - Reset database and reapply all migrations"
    exit 1
}

# Check if command is provided
if [ $# -lt 1 ]; then
    show_usage
fi

# Execute command
case "$1" in
    "up")
        echo "Applying migrations..."
        npx supabase migration up
        ;;
    "down")
        echo "Reverting last migration..."
        npx supabase migration down 1
        ;;
    "new")
        if [ $# -lt 2 ]; then
            echo "Error: Migration name required"
            show_usage
        fi
        echo "Creating new migration '$2'..."
        npx supabase migration new "$2"
        ;;
    "reset")
        echo "Resetting database..."
        npx supabase db reset
        ;;
    *)
        show_usage
        ;;
esac 