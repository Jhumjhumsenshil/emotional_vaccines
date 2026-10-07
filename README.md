# Video Portal Application (`emotional_vaccines`)

A full-stack video portal and authentication platform built with **FastAPI**, **PostgreSQL**, and **Next.js (App Router)**. Features password hashing, dual-identifier login (username or email), session persistence, and a custom CSS design system.

---

## Tech Stack

### **Backend**
* **Framework:** FastAPI
* **Database ORM:** SQLAlchemy
* **Database Driver:** PostgreSQL with `psycopg` (v3)
* **Security & Auth:** Password hashing via `werkzeug.security` (`scrypt`)

### **Frontend**
* **Framework:** Next.js (App Router, React)
* **Language:** TypeScript
* **Styling:** Custom CSS variables (`app/globals.css`)

---

## Key Features

* **User Registration:** Secure account creation with validated name, username, email, and hashed password.
* **Dual Login:** Authenticate using either **username** or **email address**.
* **Protected Dashboard:** Session-based user dashboard displaying account details with client-side route protection.
* **Responsive Design System:** Unified component styling for authentication flows, form elements, and user profile cards.

---

