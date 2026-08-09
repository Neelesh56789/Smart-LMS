# SmartLMS

A full-stack Learning Management System for browsing, purchasing, and consuming online courses — built with a ReactJS frontend and a Node.js backend, with a real Stripe checkout integration.

**Live demo:** https://smart-lms-ylwe.onrender.com/
*(Hosted on Render's free tier — the first load may take ~30s while the instance wakes up.)*

## Features

- **Course catalog** — browse, search, and filter courses by category and price range, with sorting (popularity, price).
- **Course detail pages** — pricing, enrollment counts, ratings, and curriculum breakdown.
- **Checkout via Stripe** — real payment integration supporting multiple currencies (INR/USD with live conversion), card payments, Apple Pay, and Link.
- **Authentication** — user accounts with profile settings and a "My Courses" dashboard.
- **Lesson player** — module-by-module video lessons with progress tracking and completion marking.

## Tech Stack

- **Frontend:** ReactJS
- **Backend:** Node.js
- **Payments:** Stripe (Checkout Sessions)
- **Deployment:** Render

> Backend data store, auth strategy, and exact framework versions to be documented — see `course-selling-platform/` for source.

## Project Structure

```
Smart-LMS/
├── course-selling-platform/   # Main application source
├── srs.txt                    # Software requirements specification
└── .gitignore
```

## Getting Started

Clone the repo and install dependencies for the app in `course-selling-platform/`:

```bash
git clone https://github.com/Neelesh56789/Smart-LMS.git
cd Smart-LMS/course-selling-platform
npm install
```

Set up environment variables (Stripe keys, etc.) as required by the app, then run:

```bash
npm start
```

> Exact env vars and run scripts depend on the project's `package.json` — update this section with the real commands before sharing widely.

## Author

**Neelesh Tiwari**
[LinkedIn](https://www.linkedin.com/in/neelesh-tiwari-076922176/) · [GitHub](https://github.com/Neelesh56789)
