#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python mysite/manage.py migrate

# Collect static files
python mysite/manage.py collectstatic --no-input
