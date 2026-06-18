# 🌿 GreenDrive AI

### 🔗 [Live Deployment Demo](https://greendrive-1082596306226.europe-west1.run.app/) | 🚀 Powered by Gemini 1.5 & Google Cloud

> **Tactical Energy Intelligence for the Modern Driver.**

GreenDrive is a production-grade, AI-driven route optimization platform built for the **Amman-Jordan** ecosystem. It integrates real-world terrain physics and live vehicle telemetry to calculate the true cost of every trip—both in JOD and CO₂.

---

## 📸 App Preview & Interface
*(Optional: Insert your project screenshot here by uploading an image to this repo and linking it like: `<img src="https://github.com/user-attachments/assets/5ea033eb-25d6-4ce2-a3b1-58e1f1f53e1f" width="100%" alt="GreenDrive Interface" />)*

---

## 📽️ The Vision
In a region like Jordan, where fuel prices are high and terrain (like Amman's hills) significantly impacts efficiency, standard navigation falls short. GreenDrive fills this gap with a **Physics-First** approach to optimize route energy consumption.

## ✨ Key Innovation: The AI Eco-Coach
Powered by the **Gemini 1.5 API**, GreenDrive features a dedicated "AI Eco-Coach" that acts as an energy consultant.
* **Context-Aware Briefings**: Analyzes route ascent, traffic conditions, and vehicle type to provide human-readable advice.
* **Dynamic Analysis**: On-demand route breakdown that explains why a path is eco-friendly or balanced.
* **Impact Projections**: Converts abstract CO₂ grams into tangible metrics, like "Bio-Equivalent" mature tree absorption.

---

## 🛠️ The Technical Powerhouse
Built with a focus on high-fidelity performance and zero-regression architecture:

### ⚛️ Frontend Architecture
* **React 19 & Vite**: Utilizing the latest React features for fast performance.
* **Framer Motion**: Premium glassmorphic UI with smooth micro-animations and layout transitions.
* **Three.js / WebGL**: Ambient liquid mesh backgrounds and topographic grid overlays.
* **RTL-First**: Deeply integrated Arabic/English support using Tailwind logical properties and a custom i18n engine.

### 🧮 Physics & Mapping
* **Elevation-Aware Routing**: Real-time integration with **Google Maps SDK** and **Elevation API** to calculate terrain impact.
* **Vehicle-Specific Modeling**: Custom efficiency curves for **Petrol, Diesel, Hybrid, and Electric (EV)** vehicles.
* **Jordan-Specific Calibration**: Hardcoded with local Ministry of Energy fuel pricing and NEPCO grid carbon intensity.

### 🛡️ Infrastructure
* **Firebase Core**: Secure Auth, Firestore real-time sync, and Hosting.
* **Auth Vault**: A secure interface for managing user profiles and sustainability history.

---

## 🚀 Production & Deployment
* **Google Cloud Run**: Containerized deployment for serverless scalability.
* **Cloud Build (CI/CD)**: Automated multi-stage Docker builds with secure environment injection.
* **Nginx Optimized**: High-performance static asset serving with custom routing configurations.

### 🏁 Quick Start for Judges
1. **The Landing**: Experience the WebGL-powered liquid background.
2. **The Vault**: Sign in to see the personalized vehicle settings.
3. **The Mission**: Map "Amman" to "Dead Sea" (dramatic elevation change).
4. **The Briefing**: Click **"More details via AI"** for the tactical Eco-Coach breakdown.

---

## 👥 The Team
* **Humam Taibeh**: AI-Assisted Systems Engineer
* **Heba Taibeh**: Product Strategy & UX Design
* **Natalia Al-Hajawi**: Security & QA Lead
