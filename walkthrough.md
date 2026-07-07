# Django Render Deployment Walkthrough

We have successfully configured the Django application inside the `server` directory to make it ready for production deployment on Render. 

Below is a summary of the changes we made and the step-by-step instructions you need to follow on the Render Dashboard to deploy your backend.

---

## 🛠️ Summary of Changes Made

1. **Production Dependencies Added**:
   - Created [requirements.txt](file:///c:/Users/Mohammad%20Woafi/Documents/Programming/Project/Webapp/Demo-Project/kanban/server/requirements.txt) and updated the local `Pipfile`/`Pipfile.lock`.
   - Added `gunicorn` (production server), `whitenoise` (static file hosting), `dj-database-url` (parsing DATABASE_URL), `psycopg2-binary` (PostgreSQL adapter), and `Pillow` (for handling `ImageField` models).

2. **Python Runtime Specified**:
   - Created [runtime.txt](file:///c:/Users/Mohammad%20Woafi/Documents/Programming/Project/Webapp/Demo-Project/kanban/server/runtime.txt) specifying `python-3.11.9` to ensure Render spins up a stable Python environment.

3. **Render Build Script**:
   - Created [build.sh](file:///c:/Users/Mohammad%20Woafi/Documents/Programming/Project/Webapp/Demo-Project/kanban/server/build.sh) which handles dependency installation (`pip install`), running migrations (`manage.py migrate`), and compiling static assets (`manage.py collectstatic`).

4. **Dynamic Settings Configuration**:
   - Modified [settings.py](file:///c:/Users/Mohammad%20Woafi/Documents/Programming/Project/Webapp/Demo-Project/kanban/server/mysite/mysite/settings.py):
     - **Secrets**: Reads `SECRET_KEY` and `DEBUG` status from environment variables.
     - **Allowed Hosts**: Automatically detects and registers Render's hostname (`RENDER_EXTERNAL_HOSTNAME`) in addition to local hosts.
     - **CORS/CSRF**: Dynamically appends `FRONTEND_URL` environment variable if specified, and automatically strips trailing slashes to prevent validation errors.
     - **Middleware**: Integrated WhiteNoise for high-performance serving of static files in production.
     - **Database**: Dynamically switches database settings to PostgreSQL when `DATABASE_URL` environment variable is defined (which Render sets for PostgreSQL instances), falling back to SQLite for local development.
     - **Static & Media Assets**: Configured static files compiling directories (`STATIC_ROOT`) and compression storage.

5. **Local Verification**:
   - Verified that the server starts up correctly, dependencies resolve without any syntax or runtime import errors, and the system check passes.

---

## 🚀 Step-by-Step Render Deployment Guide

Follow these steps in your [Render Dashboard](https://dashboard.render.com/) to launch your Django server:

### Step 1: Create a PostgreSQL Database
On the Render free tier, SQLite databases are ephemeral (they reset on every build/restart). Therefore, we need a PostgreSQL database to persist your application data.
1. Click **New +** at the top right of your Render Dashboard and choose **PostgreSQL**.
2. Fill out the fields:
   - **Name**: `kanban-db` (or anything you prefer)
   - **Region**: Select the same region you plan to use for your Web Service (e.g., Oregon `us-west-2` or Frankfurt `eu-central-1`) to minimize latency.
3. Click **Create Database** at the bottom.
4. Once the database status changes to **Available**, scroll down to the **Connections** section and copy the **Internal Database URL** (e.g. `postgres://...`). We will use this in the next steps.

---

### Step 2: Create a Web Service
Now, deploy the application code.
1. Click **New +** and select **Web Service**.
2. Connect your Git repository (GitHub/GitLab).
3. Configure the following settings:
   - **Name**: `kanban-backend`
   - **Language**: `Python`
   - **Branch**: Select your main/master branch.
   - **Root Directory**: `server` *(CRITICAL: This tells Render that your Django app is inside the `server/` directory, making all paths relative to it)*.
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn mysite.wsgi:application --chdir mysite`
   - **Instance Type**: Select **Free** (or your preferred paid tier).

---

### Step 3: Configure Environment Variables
Before deploying, we must add the production environment variables so Django can configure itself:
1. Under the Web Service configuration, click on the **Environment** tab.
2. Add the following **Key-Value** pairs:

| Environment Variable Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *[Paste the **Internal Database URL** from Step 1]* | Connects Django to your Postgres database. |
| `DJANGO_SECRET_KEY` | *[Generate a long random secure string]* | Production secret key for Django cryptographic signing. |
| `DEBUG` | `False` | Disables debug mode in production. |
| `FRONTEND_URL` | *[Paste your frontend's deployment URL]* | e.g. `https://kanban-frontend.onrender.com` or Vercel URL. This registers it for CORS and CSRF access. |

3. Click **Save Changes**.

---

### Step 4: Build and Verify Deployment
- Render will automatically trigger a build once the service is saved.
- You can watch the logs. Render will run `build.sh` (installing dependencies, applying migrations, compiling static files), and start the Gunicorn server.
- Once the log shows **"Your service is live"**, your backend is up and running!

---

### Step 5: Create a Superuser (Admin Login)
There are two ways to create a superuser for your deployed application so that you can log in to `/admin`:

#### Option A: Manual creation via Render Web Shell (Recommended)
1. Go to your Web Service in the Render Dashboard.
2. In the left navigation menu, click on **Shell**.
3. Run the following command:
   ```bash
   python mysite/manage.py createsuperuser
   ```
4. It will prompt you for an **Email** and **Password** (note: the username field is disabled on this custom User model, so it only asks for email). Type them in and press Enter.

#### Option B: Automatic creation via Environment Variables
1. Go to the **Environment** tab of your Web Service.
2. Add the following environment variables:
   - `DJANGO_SUPERUSER_EMAIL`: The email you want to use (e.g., `admin@example.com`).
   - `DJANGO_SUPERUSER_PASSWORD`: A secure password.
3. Save changes. On the next deployment, Render will automatically run the script to create this superuser (and will skip creation if it already exists).
