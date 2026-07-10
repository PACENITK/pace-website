# PACE Portal — Server Docker Operations Guide

This guide describes how to manage, debug, seed, and inspect the containerized backend and database stack once you have terminal access to the host server.

---

## 1. Prerequisites (Setup on Host)

Before launching the container stack, check these configurations:

1. **Verify Docker Installation**:
   ```bash
   docker --version
   docker compose version
   ```
2. **Stop Legacy Services**:
   Ensure no process is running on the host binding to port `5000` (e.g., node, PM2, or nodemon):
   ```bash
   # Kill any process listening on port 5000
   sudo fuser -k 5000/tcp || true
   ```
3. **Environment Setup**:
   Ensure a completed `.env.production` file is located in the `./backend` directory.

---

## 2. Managing the Container Stack

Run these commands from the root directory (where `docker-compose.yml` is located):

*   **Start all services in the background (detached mode)**:
    ```bash
    docker compose up -d
    ```
*   **Rebuild and restart after changing code or environment variables**:
    ```bash
    docker compose up -d --build backend
    ```
*   **Stop the running container services without losing data**:
    ```bash
    docker compose down
    ```
*   **Stop services and remove all persistent database records (CAUTION: Wipe Database)**:
    ```bash
    docker compose down -v
    ```

---

## 3. Database Seeding & Setup

To seed the initial database with mock users and mock internship postings for local testing:

```bash
# Execute the seeder script inside the running backend container
docker compose exec backend npm run seed
```

---

## 4. Monitoring & Troubleshooting

*   **View live logs (consolidated output)**:
    ```bash
    docker compose logs -f
    ```
*   **View live logs for a specific service**:
    ```bash
    docker compose logs -f backend
    docker compose logs -f frontend
    docker compose logs -f mongo
    ```
*   **Check container health status and mapped ports**:
    ```bash
    docker compose ps
    ```
*   **Check live CPU / Memory consumption stats of containers**:
    ```bash
    docker stats
    ```

---

## 5. Entering the Container Shells

To debug configurations or inspect filesystem states directly inside the container environments:

*   **Open a shell inside the backend container**:
    ```bash
    docker compose exec -it backend sh
    ```
*   **Open the MongoDB client CLI (`mongosh`)**:
    ```bash
    docker compose exec -it mongo mongosh
    ```
    *Useful Mongo commands:*
    ```javascript
    use pace;               // Switch to application database
    show collections;       // List all tables (users, internships, etc.)
    db.users.find().pretty(); // View registered users
    exit;                   // Exit MongoDB shell
    ```

---

## 6. Security Validations

To verify container hardening parameters on the server:

*   **Confirm process runs as non-root user**:
    ```bash
    docker compose exec backend whoami
    # Expected output: node
    ```
*   **Query connection health status**:
    ```bash
    curl -i http://localhost:5000/health
    # Expected response: 200 OK {"success":true,"status":"healthy","database":"connected",...}
    ```
