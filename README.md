# 🌿 GreenDrive AI
> **Tactical Energy Intelligence for the Modern Driver.**

GreenDrive is a production-grade, AI-driven route optimization platform built for the **Amman-Jordan** ecosystem. It goes beyond simple navigation by integrating real-world terrain physics and live vehicle telemetry to calculate the true cost of every trip—both in JOD and CO₂.

---

## 📽️ The Vision
In a region like Jordan, where fuel prices are high and terrain (like Amman's hills) significantly impacts efficiency, standard navigation falls short. GreenDrive fills this gap with a **Physics-First** approach, turning every drive into a tactical sustainability mission.

## ✨ Key Innovation: The AI Eco-Coach
Powered by the **Gemini 1.5 API**, GreenDrive features a dedicated "AI Eco-Coach" that acts as a tactical energy consultant.
- **Context-Aware Briefings**: Analyzes route ascent, traffic waste, and vehicle type to provide human-readable tactical advice.
- **Dynamic Analysis**: On-demand route breakdown that explains *why* a path is eco-friendly or balanced.
- **Impact Projections**: Converts abstract CO₂ grams into tangible metrics, like "Bio-Equivalent" mature tree absorption.

---

## 🛠️ The Technical Powerhouse
Built with a focus on high-fidelity performance and zero-regression architecture:

### ⚛️ Frontend Excellence
- **React 19 & Vite**: Utilizing the latest React features for ultra-fast performance.
- **Framer Motion**: Premium glassmorphic UI with smooth micro-animations and layout transitions.
- **Three.js / WebGL**: Ambient liquid mesh backgrounds and topographic grid overlays for a "Command Center" feel.
- **RTL-First**: Deeply integrated Arabic/English support using Tailwind logical properties and a custom i18n engine.

### 🧮 Physics & Mapping
- **Elevation-Aware Routing**: Real-time integration with **Google Maps SDK** and **Elevation API** to calculate `mgh` work penalty.
- **Vehicle-Specific Modeling**: Custom efficiency curves for **Petrol, Diesel, Hybrid, and Electric (EV)** vehicles.
- **Jordan-Specific Calibration**: Hardcoded with local Ministry of Energy fuel pricing (May 2026) and NEPCO grid carbon intensity.

### 🛡️ Secure Infrastructure
- **Firebase Core**: Secure Auth, Firestore real-time sync, and lightning-fast Hosting.
- **Auth Vault**: A military-grade interface for managing user profiles and sustainability history.

---

## 🚀 Getting Started for Judges

### 1. Requirements
Ensure you have the following environment variables set in your `.env.local`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
VITE_FIREBASE_API_KEY=your_key
# ... and other Firebase config variables
```

### 2. Launch
```bash
npm install
npm run dev
```

### 3. "How to Judge" — Key Demo Path
1. **The Landing**: Experience the WebGL-powered liquid background and scroll-spy navigation.
2. **The Vault**: Sign in to see the personalized "Lead" profile and vehicle settings.
3. **The Mission**: Go to the Map, select "Amman" to "Dead Sea" (dramatic elevation change).
4. **The Briefing**: Select a route and click **"More details via AI"**. Watch the AI Eco-Coach provide a tactical breakdown of the terrain and fuel savings.
5. **The Impact**: Toggle between Arabic and English to see the pixel-perfect RTL transition.

---

## 👥 The Team
- **Humam Taibeh**: Lead Architect & Systems Engineer
- **Heba Taibeh**: Product Strategy & Experience Design
- **Natalia Al-Hajawi**: Security & QA Lead

---

*Engineered with precision for a greener tomorrow.*
