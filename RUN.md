# Matie Cakes — Project Run Guide

> **Team Note:** This project uses a native PostgreSQL installation (not Docker). Each team member must have PostgreSQL installed locally and run the setup steps below once before the first run.

---

## ⚡ QUICK START — Daily Use

> If you have already completed First-Time Setup on your machine, these **2 steps** are all you need every session.

**Step 1 — Start the Backend (open a new terminal):**
```powershell
cd backend
venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Keep this terminal open. Do NOT close it while using the app.

**Step 2 — Start the Frontend:**
- Right-click `index.html` in VS Code → **"Open with Live Server"**

✅ App is running at your browser.

---

## 🛠️ FIRST-TIME SETUP (Run once per machine)

### Prerequisites — Install these first

| Tool | Where to get it |
|---|---|
| Python 3.10+ | https://www.python.org/downloads/ |
| PostgreSQL 15+ (native) | https://www.postgresql.org/download/windows/ |
| pgAdmin 4 | Included with PostgreSQL installer |
| VS Code | https://code.visualstudio.com/ |
| Live Server (VS Code extension) | Search "Live Server" by Ritwick Dey in VS Code |

---

### Step 1 — Clone the Repository

```powershell
git clone <your-repo-url>
cd matiecakes
```

---

### Step 2 — Create 3 Databases in pgAdmin

1. Open **pgAdmin 4** and connect to your local PostgreSQL server.
2. Right-click **Databases** → **Create** → **Database** and create these three (exact names, lowercase):

| Database Name |
|---|
| `member_db` |
| `payment_db` |
| `admin_db` |

---

### Step 3 — Configure Your Database Credentials

Open `backend/db_utils.py` and update the three connection strings to match **your local PostgreSQL** username and password:

```python
MEMBER_DB_URL = "postgresql+pg8000://postgres:YourPassword@localhost:5432/member_db"
PAYMENT_DB_URL = "postgresql+pg8000://postgres:YourPassword@localhost:5432/payment_db"
ADMIN_DB_URL  = "postgresql+pg8000://postgres:YourPassword@localhost:5432/admin_db"
```

> ⚠️ **Special characters in passwords:** If your password contains `@`, replace it with `%40`.
> Example: `MyPass@2024` → write as `MyPass%402024`

---

### Step 4 — Create the `.env` File

The `.env` file is **NOT included in the repo** (it contains secret keys). Create it manually:

1. Inside the `backend/` folder, create a new file named `.env`
2. Add the following content:

```
AI_KEY=your_groq_api_key_here
```

> Get a free Groq API key at: https://console.groq.com/

---

### Step 5 — Activate Virtual Environment & Install Dependencies

```powershell
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

> If `venv` does not exist yet, create it first:
> ```powershell
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt
> ```

---

### Step 6 — Initialize the Database Schema

Creates all tables in the 3 databases using the current `models.py`:

```powershell
python create_schema.py
```

Expected output:
```
MEMBER_DB tables created successfully.
PAYMENT_DB tables created successfully.
ADMIN_DB tables created successfully.
```

---

### Step 7 — Run Migration Script (v2.0 schema update)

This aligns any existing tables to the latest schema (required if you previously had an older version of the DB):

```powershell
python migrate_schema_v2.py
```

---

### Step 8 — Seed Sample Data

Populate the databases with test data. **Run in this exact order:**

```powershell
python seed_users.py
python seed_inventory.py
python seed_payments.py
python seed_admin_data.py
```

> `seed_users.py` must run **first** — other scripts depend on users existing.

---

### Step 9 — Start the Backend

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Leave this terminal **open**. Backend runs at: `http://localhost:8000`

---

### Step 10 — Launch the Frontend

- Open the `matiecakes/` root folder in VS Code.
- Right-click `index.html` → **"Open with Live Server"**.

The website opens automatically in your browser.

---

## 🗄️ Database Structure (v2.0)

| Database | Tables |
|---|---|
| `member_db` | `users`, `workshop_registrations` |
| `payment_db` | `orders`, `order_details`, `payments` |
| `admin_db` | `warehouse_inventory`, `cake_analytics`, `customer_profiles`, `shipping_status` |

Full ERD diagram and relationship details → see `database_erd.md` in the project root.

---

## 💡 Troubleshooting

| Problem | Solution |
|---|---|
| `InterfaceError: Can't create connection` | PostgreSQL is not running. Open Windows Services → start **postgresql** service. |
| `MEMBER_DB tables created: Error` | Check username/password in `db_utils.py`. Make sure the 3 databases exist in pgAdmin. |
| `No module named '...'` | You forgot to activate venv. Run `venv\Scripts\activate` first. |
| `404 Not Found` on `/chat` | Backend is not running. Start it with the `uvicorn` command. |
| AI chatbot not responding | Check `backend/.env` — `AI_KEY` must be a valid Groq API key. |
| All products show "Sold Out" | Run `python seed_inventory.py` again from inside `backend/`. |
| Port 8000 already in use | Another process is using it. Run: `netstat -ano \| findstr :8000` then kill that PID. |

---

## 📁 Files NOT Included in the Repo (by design)

These are excluded by `.gitignore`. Each team member must create/set them up locally:

| File / Folder | Why excluded | What to do |
|---|---|---|
| `backend/.env` | Contains secret API key | Create manually (see Step 4) |
| `backend/venv/` | Python packages | Run `pip install -r requirements.txt` |
| `backend/faiss_index/` | Auto-generated AI vector index | Created automatically on first backend start |
| `postgres_data/` | Old Docker DB volume (no longer used) | Ignore — we use native PostgreSQL now |
