[🏛️ Back to Main Profile](https://github.com/Humam-Taibeh)

# 🌿 GreenDrive AI

### 🔗 [Live Demo](https://greendrive-1082596306226.europe-west1.run.app/) | Built with Gemini 1.5 & Google Cloud

> A route-optimization prototype that factors in Amman's hills — not just distance.
> Built for the Google Antigravity Hackathon, AI for Intelligent Transportation track.

GreenDrive is a route-optimization tool built for Amman, Jordan's hilly terrain. The core idea: instead of ranking routes by distance alone, it computes the actual gravitational work (`mgh`) a route demands using live elevation data, and weighs that against a Jordanian fuel/EV tariff matrix — to show the real financial and environmental cost of a trip, in JOD and CO₂.

---

## 📸 App Preview & Interface
<img src="https://github.com/user-attachments/assets/5ea033eb-25d6-4ce2-a3b1-58e1f1f53e1f" width="100%" alt="GreenDrive Interface Overview" />
<br><br>
<img src="https://github.com/user-attachments/assets/1c5ca618-16b1-421e-8933-216189574e48" width="100%" alt="GreenDrive Multi-Route Analytics" />
<br><br>
<img src="https://github.com/user-attachments/assets/bb41f91b-9fb6-42eb-831d-26efeac27b2d" width="100%" alt="GreenDrive AI Eco-Coach Briefing" />
<br><br>

---

## 📽️ The Problem We Targeted

Amman's steep hills and traffic bottlenecks mean standard, distance-based navigation often misses the real cost of a trip — elevation change can increase fuel consumption a lot more than a few extra kilometers would.

GreenDrive addresses this with three route options:

1. **Fastest Route** — standard time-optimized routing.
2. **Eco-Route (AI-Optimized)** — weighs traffic, signal density, and elevation penalties to minimize fuel waste, even at a slightly longer distance.
3. **Balanced Route** — a middle ground between speed and energy conservation.

---

## ✨ AI Eco-Coach

Using the **Gemini 1.5 API**, GreenDrive includes an on-demand "AI Eco-Coach" calibrated with Jordanian fuel and EV tariffs. It:

* Estimates money saved (in JOD) based on your vehicle's consumption
* Explains why a route is more efficient given Amman's terrain
* Converts CO₂ savings into easier-to-picture terms

---

## 🛠️ How It's Built

### Frontend
* **React 19 & Vite**
* **Framer Motion** for UI animation
* **Three.js / WebGL** for the animated background visuals
* **RTL-first**: English and Arabic UI support via Tailwind logical properties

### Mapping & Backend
* **Google Maps SDK & Elevation API** for live elevation data and the `mgh` calculation
* Per-vehicle consumption matrices for petrol, diesel, hybrid, and EV
* **Firebase** for authentication and real-time data sync

### Deployment
* **Google Cloud Run** for hosting
* **Cloud Build** for automated CI/CD
* **Nginx** serving static assets

---

## 🤖 How We Actually Built This

Full transparency on process: this was built by directing AI coding tools — **Claude, Gemini, and Google's Antigravity** — to architect and implement the project within the hackathon timeframe, rather than writing every line manually. That's genuinely how I build: I focus on the idea, the architecture, and the product decisions, and use AI tools (with a lot of prompt iteration) to turn that into working, deployed software. I'm a 3rd-year AI student still building up my core programming fundamentals alongside this — GreenDrive was as much practice in system design and prompt engineering as it was a hackathon submission.

---

## 🏁 For Judges / Reviewers

1. View the landing page.
2. Sign in and pick a vehicle type (EV, petrol, hybrid, or diesel).
3. Enter a route with a big elevation change (e.g., Amman → Dead Sea).
4. Click "More details via AI" for the Gemini-generated cost/savings breakdown.

---

## 👥 The Team

* **[Humam Taibeh](https://github.com/Humam-Taibeh)** — AI-directed development & architecture
* **[Heba Taibeh](https://github.com/HebaZakwan)** — Product Strategy & UX Design
* **[Natalia Al-Hajawi](https://github.com/silvercreeks14)** — Security & QA

---

[🏛️ Back to Main Profile](https://github.com/Humam-Taibeh)
