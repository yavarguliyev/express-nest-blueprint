#!/bin/sh
set -e

# Substitute environment variables in prometheus.yml
sed "s/\${HEALTH_CHECK_SECRET}/$HEALTH_CHECK_SECRET/g" /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml

# Start Prometheus with the processed config
exec /bin/prometheus "$@"
