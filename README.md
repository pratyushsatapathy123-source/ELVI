# ELVI — Personal Health, Cycle, & PCOS/PCOD Companion

ELVI is a longitudinal health companion web application designed to empower individuals to track menstrual cycles, symptoms, nourishment, hydration, and clinical lab records while providing evidence-informed longitudinal pattern analysis and physician-ready report generation.

---

## 🌟 Key Features

1. **Deterministic Cycle Analytics**: Calculates reliable cycle intervals, average durations, regularity rhythms, and missing-data gaps without relying on AI hallucination.
2. **Longitudinal Health Insights Timeline**: Distinguishes confirmed health records from AI-derived pattern insights, complete with confidence levels, uncertainty disclosures, and review/dismiss controls.
3. **Consent-Governed AI Companion**: Chat interface powered by **Gemini (`gemini-3.6-flash`)** that retains conversational health context only when user memory consent is explicitly enabled, with review-before-save proposal workflows.
4. **Physician-Ready Report Generation & PDF Export**: Synthesizes 30-, 60-, or 90-day health summaries across cycles, symptoms, food, hydration, and uploaded clinical panels. Generates authentic, downloadable PDF reports using `jsPDF`.
5. **Strict Clinical Safety Boundaries**: Enforces prominent non-diagnostic medical disclaimers, clear separation of facts vs AI interpretations, and transparent data coverage disclosures.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Custom ELVI design system: Cherry `#890149`, Alabaster `#F3F3E7`, Dusty Rose `#D9A2B5`, Warm Ink `#30232A`, DM Serif Display headings, DM Sans body).
- **Icons**: Lucide React.
- **PDF Export**: `jsPDF` client-side report generator.
- **Backend**: Node.js & Express (`server.ts`) with Vite middleware integration.
- **Database & Auth**: Firebase Firestore & Firebase Authentication (`elvi-osfic`).
- **Artificial Intelligence**: Google GenAI TypeScript SDK (`@google/genai`) using `gemini-3.6-flash`.

---

## 🚀 Getting Started & How to Run

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/elvi-health-companion.git
cd elvi-health-companion
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and provide your configuration variables (such as Gemini API key if running external AI requests):
```bash
cp .env.example .env
```

### 3. Running Locally (Development)
Start the full-stack development server (Express backend + Vite frontend on port 3000):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Building for Production
To build the application for production deployment:
```bash
npm run build
```
To run the production server:
```bash
npm start
```

---

## 🧪 Verification & Testing
To run the built-in verification test suite (testing cycle statistics, PDF blob generation, longitudinal pattern analysis, and AI memory consent logic):
```bash
npx tsx scripts/verifyPhase4.ts
```

---

## 📄 License & Clinical Disclaimer
ELVI is designed for self-tracking and health insight exploration. It does not provide medical diagnoses, prescribe treatment, or replace professional healthcare evaluation. Always consult a qualified healthcare professional.
