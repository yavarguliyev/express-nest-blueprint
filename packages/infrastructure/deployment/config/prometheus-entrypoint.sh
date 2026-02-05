#!/bin/sh
set -e

# Substitute environment variables in prometheus.yml
envsubst < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml

# Start Prometheus with the processed config
exec /bin/prometheus "$@"
