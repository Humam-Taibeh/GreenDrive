[🏛️ Back to Main Profile](https://github.com/Humam-Taibeh)

# 🌿 GreenDrive AI

### 🔗 [Live Deployment Demo](https://greendrive-1082596306226.europe-west1.run.app/) | 🚀 Powered by Gemini 1.5 & Google Cloud

> **Tactical Energy Intelligence for the Modern Driver.**
> Developed for the Google Hackathon under the **AI for Intelligent Transportation** track.

GreenDrive is a production-grade, AI-driven route optimization platform engineered for the **Amman, Jordan** ecosystem. Its core is a physics-first routing architecture: gravitational work penalties (`mgh`) computed from live elevation data, cross-referenced against a localized Jordanian energy-tariff matrix (petrol, diesel, hybrid, EV) and per-vehicle consumption curves, to surface the true financial and environmental cost of every trip — in JOD and CO₂.

---

## 📸 App Preview & Interface
<img src="https://github.com/user-attachments/assets/5ea033eb-25d6-4ce2-a3b1-58e1f1f53e1f" width="100%" alt="GreenDrive Interface Overview" />
<br><br>
<img src="https://github.com/user-attachments/assets/1c5ca618-16b1-421e-8933-216189574e48" width="100%" alt="GreenDrive Multi-Route Analytics" />
<br><br>
<img src="https://github.com/user-attachments/assets/bb41f91b-9fb6-42eb-831d-26efeac27b2d" width="100%" alt="GreenDrive AI Eco-Coach Briefing" />
<br><br>

---

## 📽️ The Vision & Regional Impact

In a mountainous region like Jordan — specifically Amman's steep hills and predictable traffic bottlenecks — standard, distance-based navigation falls short. Elevation changes dramatically increase fuel consumption.

GreenDrive solves this with a **physics-first approach** that surfaces 3 distinct route choices:

1. **The Fastest Route:** Standard mapping optimization (similar to Google Maps).
2. **The Eco-Route (AI Optimized):** Weighs traffic delays, signal density, and elevation penalties to find the path that minimizes fuel waste, even if the distance is slightly longer.
3. **The Balanced Route:** A hybrid optimization between speed and energy conservation.

---

## ✨ Key Innovation: The AI Eco-Coach

Powered by the **Gemini 1.5 API**, GreenDrive features an on-demand "AI Eco-Coach" calibrated with local Jordanian energy and fuel pricing (petrol, hybrid, diesel, and EV electricity tariffs).

* **Financial Comparisons:** Calculates estimated money saved (in JOD) based on your specific vehicle's consumption curve.
* **Context-Aware Briefings:** Explains the rationale behind a route's efficiency relative to Amman's topography.
* **Impact Projections:** Converts abstract CO₂ grams into tangible, relatable metrics.

---

## 🛠️ The Technical Powerhouse

Built with a focus on high-fidelity performance and secure cloud scaling within the **Google Cloud ecosystem**:

### ⚛️ Frontend Architecture
* **React 19 & Vite:** Latest React streaming features for rapid client-side performance.
* **Framer Motion:** Glassmorphic UI with smooth, interactive micro-animations.
* **Three.js / WebGL:** Ambient dynamic liquid-mesh backgrounds for an immersive "command center" aesthetic.
* **RTL-First:** Full English and Arabic UI support using Tailwind logical properties.

### 🧮 Physics, Mapping & Backend
* **Elevation-Aware Routing:** Real-time integration with the **Google Maps SDK** and **Elevation API** to compute gravitational work penalties (`mgh`).
* **Vehicle-Specific Calibration:** Dynamic consumption matrices tailored for petrol, diesel, hybrid, and electric (EV) drivetrains.
* **Firebase Suite:** Firebase Authentication and Firestore real-time synchronization.

### 🛡️ Production & Cloud Deployment (Google Cloud Native)
* **Google Cloud Run:** Serverless containerized hosting for dynamic horizontal scalability.
* **Cloud Build (CI/CD):** Multi-stage automated Docker builds with secure environment-variable injection.
* **Nginx Optimized:** High-performance static routing layer serving client assets.

---

## 🏁 Quick Start for Judges

1. **The Landing:** View the WebGL-powered dashboard.
2. **The Vault:** Sign in and calibrate your vehicle type (EV, petrol, hybrid, or diesel).
3. **The Mission:** Input a route with drastic elevation change (e.g., *Amman* to *Dead Sea*).
4. **The Briefing:** Click **"More details via AI"** to generate the localized Gemini pricing and savings breakdown.

---

## 👥 The Team

* **[Humam Taibeh](https://github.com/Humam-Taibeh)** — AI-Assisted Systems Engineer
* **[Heba Taibeh](https://github.com/HebaZakwan)** — Product Strategy & UX Design
* **[Natalia Al-Hajawi](https://github.com/silvercreeks14)** — Security & QA Lead

---

[🏛️ Back to Main Profile](https://github.com/Humam-Taibeh)
