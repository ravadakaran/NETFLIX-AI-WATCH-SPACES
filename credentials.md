# Netflix AI Watch Spaces - Credentials & Access Guide

## Test User Accounts (App Login)

The following dummy accounts are automatically created in the database when the application starts (via `DataSeeder.java`). All accounts share the same password.

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password` | System Admin |
| **Host** | `host@example.com` | `password` | Alex Host |
| **Viewer**| `viewer@example.com` | `password` | Sam Viewer |

## Demo Watch Space

A default Watch Space is automatically seeded in a LIVE state, so you can join immediately:
* **Invite Code:** `NX-DEMO`
* **Movie:** Cyberpunk 2099: Neo Nexus
* **Host:** Alex Host

---

## Local Environment Details (from `.env.example`)

If you are running the infrastructure locally (e.g., via Docker), here are the default credentials configured for the backend:

**PostgreSQL Database:**
* **Host:** `localhost`
* **Port:** `5432`
* **Name:** `netflix_ai_watch`
* **User:** `netflix_admin`
* **Password:** `netflix_secure_password`

**Redis:**
* **Host:** `localhost`
* **Port:** `6379`
