#!/bin/bash
set -e

echo "Configuring pg_hba.conf for replication..."
echo "host replication all 0.0.0.0/0 trust" >> "$PGDATA/pg_hba.conf"
echo "Replication configuration complete."
