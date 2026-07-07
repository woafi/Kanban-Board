#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python mysite/manage.py migrate

# Collect static files
python mysite/manage.py collectstatic --no-input

# Optional: Create a Django superuser if environment variables are set
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    python mysite/manage.py createsuperuser --noinput || true
fi
