# AI Stadium Companion — MetLife Stadium

A premium, interactive AI-powered concourse companion web application for MetLife Stadium, built for both fans and stadium staff. The application leverages Google's Gemini models for intent classification, entity extraction, and conversational responses, fully grounded in the stadium's official Plaza Level concourse map.

## 🚀 Tech Stack

- **Frontend & Backend Framework**: [Next.js](https://nextjs.org/) (App Router, React)
- **Styling**: Vanilla CSS (Premium Glassmorphic Theme with dark mode, glowing accents, and high-fidelity visuals)
- **AI Integration**: Official `@google/genai` SDK using the `gemini-2.5-flash` model
- **Data & Geography**: Grounded in structured JSON stadium mapping data (`data/plaza_level_map.json`)
- **State Management**: Client-side React context (`context/SessionContext.js`) persisted to `localStorage`

---

## 🛠️ Installation & Setup

Follow these steps to clone, configure, and run the project locally.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18.x or later) and `npm` installed.

### 1. Download & Install Dependencies

If you downloaded the code as a zip file, extract it first. Open your terminal in the project directory (`ai-stadium-companion`) and run:

```bash
npm install
```

### 2. Configure Environment Variables

Create a file named `.env.local` in the root directory and add your Gemini API Key:

```env
GEMINI_API_KEY=AIzaSyAPS-HHn0PZHmM4KvSdMUZs3Ulr9kboIb0
```

*Note: `.env.local` is automatically gitignored to prevent accidental exposure of your keys.*

### 3. Start the Development Server

To run the application in development mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for Production (Optional)

To build the project for production and start the production server:

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
ai-stadium-companion/
├── data/
│   ├── plaza_level_map.json      # Single source of truth for gates, sections, and amenities
│   └── incident_log.json         # Persisted staff incident records (Gitignored)
├── antigravity-skills/
│   ├── navigation.md             # Core wayfinding logic (map-grounded)
│   ├── football.md               # Live score / rules / schedule instructions
│   ├── recommendation.md         # Food / merch / activity suggestion guidelines
│   ├── emergency.md              # Medical / safety override rules
│   └── staff.md                  # Staff-only crowd + incident operations guidelines
├── antigravity-workflows/
│   ├── fan_assistant.yaml        # Top-level routing workflow for the AI Chat
│   ├── navigation_flow.yaml      # Coordinates finding paths between gates & sections
│   ├── crowd_analysis.yaml       # Evaluates gate density and suggests redirection
│   ├── emergency_flow.yaml       # Handles priority emergency routing
│   ├── recommendation_flow.yaml  # Suggests food/merch and gives directions
│   └── staff_assistant.yaml      # Top-level routing workflow for Staff Dashboard
├── app/
│   ├── api/                      # Next.js Serverless API endpoints
│   ├── chat/                     # Fan AI Chat Page
│   ├── dashboard/                # Fan Dashboard
│   ├── navigation/               # Interactive Wayfinding Map Page
│   ├── staff/                    # Staff Portal & Dashboard (Auth protected)
│   ├── layout.js                 # Global application layouts
│   └── page.js                   # Landing page
├── context/
│   └── SessionContext.js         # Stores current location and user profiles across pages
└── public/
    └── football_pitch_bg.png     # Premium high-resolution FIFA pitch background image
```

---

## 👥 Portals & Features

### 1. Fan Portal
- **Dashboard**: Set your gate location, view current match info, and view quick stats.
- **AI Chat Concourse Assistant**: Live chat that guides you to restrooms, concessions, ATMs, or exits, grounded in the map.
- **Interactive Wayfinding Map**: Choose your starting point and destination to trace routes along the concourse.

### 2. Staff Portal
- **Path**: `/staff/login`
- **Default Dev Credentials**:
  - **Username**: `staff`
  - **Password**: `stadium2026`
- **Features**:
  - Live Gate Crowd Density Heatmaps & Redirect Advice.
  - Interactive Incident Reporter (persists reports directly to `data/incident_log.json`).
  - Crowd Feed Outage Simulator (toggle offline state to test fallback handling).
  - Staff Operations Chat Assistant.
