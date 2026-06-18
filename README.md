# 🌿 GreenDrive AI

### 🔗 [Live Deployment Demo](https://greendrive-1082596306226.europe-west1.run.app/) | 🚀 Powered by Gemini 1.5 & Google Cloud Ecosystem

> **Tactical Energy Intelligence for the Modern Driver.**
> Developed for the Google Hackathon under the **AI for Intelligent Transportation** track.

GreenDrive is a production-grade, AI-driven route optimization platform custom-engineered for the **Amman-Jordan** ecosystem. It goes beyond standard navigation by integrating real-world terrain physics and live vehicle telemetry to calculate the true financial and environmental cost of every trip—both in JOD and CO₂.

---

## 📸 App Preview & Interface
<img src="https://github.com/user-attachments/assets/5ea033eb-25d6-4ce2-a3b1-58e1f1f53e1f" width="100%" alt="GreenDrive Interface" />


---

## 📽️ The Vision & Regional Impact
In a mountainous region like Jordan—specifically Amman's steep hills and predictable traffic bottlenecks—standard, distance-based navigation falls short. Elevation changes dramatically increase fuel consumption. 

GreenDrive solves this by introducing a **Physics-First Approach** that analyzes 3 distinct route choices for the user:
1. **The Fastest Route:** Standard mapping optimization (similar to Google Maps).
2. **The Eco-Route (AI Optimized):** Heavily calculates traffic delays, traffic lights, and elevation penalties to find the path that minimizes fuel waste, even if the distance is slightly longer.
3. **The Balanced Route:** A hybrid optimization between speed and energy conservation.

---

## ✨ Key Innovation: The AI Eco-Coach
Powered by the **Gemini 1.5 API**, GreenDrive features an on-demand "AI Eco-Coach" calibrated with current local Jordanian energy and fuel pricing (Petrol, Hybrid, Diesel, and EV electricity tariffs).
* **Financial Comparisons:** Calculates the real-time money saved (in JOD) based on your specific vehicle type curve.
* **Context-Aware Briefings:** Explains the exact rationale behind a route's efficiency relative to Amman's topography.
* **Impact Projections:** Converts abstract CO₂ grams into tangible metrics, like "Bio-Equivalent" mature tree absorption.

---

## 🛠️ The Technical Powerhouse
Built with a focus on high-fidelity performance and secure cloud scaling within the **Google Ecosystem**:

### ⚛️ Frontend Architecture
* **React 19 & Vite:** Utilizing the latest React streaming features for rapid client-side performance.
* **Framer Motion:** Premium glassmorphic UI with smooth interactive micro-animations.
* **Three.js / WebGL:** Ambient dynamic liquid mesh backgrounds for an immersive "Command Center" aesthetic.
* **RTL-First:** Full English and Arabic UI integration using Tailwind logical properties.

### 🧮 Physics, Mapping & Backend
* **Elevation-Aware Routing:** Real-time integration with **Google Maps SDK** and **Elevation API** to compute gravitational work penalties (`mgh`).
* **Vehicle-Specific Calibration:** Dynamic consumption matrices tailored for Petrol, Diesel, Hybrid, and Electric (EV) drivetrains.
* **Firebase Suite:** Secure Firebase Authentication and Firestore real-time synchronization.

### 🛡️ Production & Cloud Deployment (Google Cloud Native)
* **Google Cloud Run:** Serverless containerized hosting for dynamic horizontal scalability.
* **Cloud Build (CI/CD):** Multi-stage automated Docker builds with highly secure environment variable injections.
* **Nginx Optimized:** High-performance static routing layer serving static client assets.

---

## 🏁 Quick Start for Judges
1. **The Landing:** View the WebGL-powered enterprise dashboard.
2. **The Vault:** Sign in and calibrate your specific vehicle type (EV, Petrol, Hybrid, or Diesel).
3. **The Mission:** Input a route with drastic elevation change (e.g., *Amman* to *Dead Sea*).
4. **The Briefing:** Click **"More details via AI"** to generate the localized Gemini pricing and savings breakdown.

---

## 👥 The Team
* **[Humam Taibeh](https://github.com/Humam-Taibeh)**: AI-Assisted Systems Engineer
* **[Heba Taibeh](https://github.com/HebaZakwan)**: Product Strategy & UX Design
* **[Natalia Al-Hajawi](https://github.com/silvercreeks14)**: Security & QA Lead
