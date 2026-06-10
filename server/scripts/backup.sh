#!/bin/bash

# Database Backup Script
# Creates daily backups of SQLite database with retention policy

set -e

# Configuration
BACKUP_DIR="./backups"
DB_FILE="./pos.db"
RETENTION_DAYS=7
BACKUP_DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/pos_backup_$BACKUP_DATE.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
  print_error "Database file not found: $DB_FILE"
  exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  print_status "Creating backup directory: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
fi

# Create backup
print_status "Starting backup..."
print_status "Source: $DB_FILE"
print_status "Destination: $BACKUP_FILE"

if cp "$DB_FILE" "$BACKUP_FILE"; then
  print_status "✓ Backup completed successfully"
  print_status "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  print_error "Failed to create backup"
  exit 1
fi

# Cleanup old backups
print_status "Cleaning up backups older than $RETENTION_DAYS days..."

if command -v find &> /dev/null; then
  OLD_FILES=$(find "$BACKUP_DIR" -name "pos_backup_*.db" -type f -mtime +$RETENTION_DAYS)
  
  if [ -z "$OLD_FILES" ]; then
    print_status "No old backups to remove"
  else
    while IFS= read -r file; do
      if [ -n "$file" ]; then
        print_status "Removing old backup: $(basename "$file")"
        rm -f "$file"
      fi
    done <<< "$OLD_FILES"
  fi
else
  print_warning "find command not available, skipping cleanup"
fi

# Display backup status
print_status "Current backups in $BACKUP_DIR:"
if command -v ls &> /dev/null; then
  ls -lh "$BACKUP_DIR"/pos_backup_*.db 2>/dev/null | tail -5 | awk '{print "  " $9 " (" $5 ")"}'
fi

print_status "✓ Backup process completed"
