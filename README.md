# Matie Cakes — Premium Bakery Website with AI Features

A modern, responsive e-commerce website for Matie Cakes, featuring a premium UI, an intelligent AI chatbot (RAG-powered), AI Product Visualizer, and a full admin dashboard backed by PostgreSQL.

---

## 🚀 Getting Started

> **→ For full setup and run instructions, please read [`RUN.md`](./RUN.md)**

`RUN.md` covers everything you need:
- First-time machine setup (PostgreSQL, Python, VS Code)
- Database creation and schema initialization
- Seeding sample data
- Starting the backend and frontend
- Troubleshooting common issues

---

## ✨ Features

- **Premium UI** — Glassmorphism design, smooth animations, fully responsive layout
- **AI Chat Assistant (RAG)** — Answers product questions using website content as knowledge base. Returns clickable product images and concise answers.
- **AI Product Visualizer** — Pick a box type and cake assortment, then generate a realistic visual preview using AI before adding to cart.
- **Full E-commerce Flow** — Product catalog, shopping cart, checkout, order tracking, and user authentication.
- **Admin Dashboard** — Manage inventory, shipping status, customer profiles, and sales analytics.

---

## 🗂️ Project Structure

```
matiecakes/
├── index.html              # Homepage
├── product.html            # Customize page (AI box builder)
├── Admin.html              # Admin dashboard
├── backend/                # Python FastAPI backend
│   ├── app.py              # Main API server
│   ├── models.py           # Database schema (SQLAlchemy)
│   ├── db_utils.py         # PostgreSQL connection config
│   ├── rag_engine.py       # AI chatbot (RAG) engine
│   ├── create_schema.py    # Initialize DB tables
│   ├── migrate_schema_v2.py# Schema migration to v2.0
│   ├── seed_users.py       # Seed sample users
│   ├── seed_inventory.py   # Seed product inventory
│   ├── seed_payments.py    # Seed payment records
│   ├── seed_admin_data.py  # Seed admin data
│   └── requirements.txt    # Python dependencies
├── src/                    # Frontend CSS & JavaScript
├── js/                     # Page-specific JavaScript modules
├── RUN.md                  # ← Full setup & run guide
└── database_erd.md         # Database design documentation (local only)
```

---

## 🗄️ Database Architecture

This project uses **3 separate PostgreSQL databases** (Microservices pattern):

| Database | Tables |
|---|---|
| `member_db` | `users`, `workshop_registrations` |
| `payment_db` | `orders`, `order_details`, `payments` |
| `admin_db` | `warehouse_inventory`, `cake_analytics`, `customer_profiles`, `shipping_status` |

---

## 🤝 Contributors

- Matie Cakes Team

## 📄 License

This project is licensed under the MIT License.