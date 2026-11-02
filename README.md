# AUTO-interview

> Practice technical and behavioral job interviews **locally** with a real-time conversational AI voice agent tailored to your resume.

AUTO-interview is a full-stack, open-source application designed to simulate realistic job interviews directly in your browser. Powered by [Pipecat](https://github.com/pipecat-ai/pipecat), WebRTC, and fast speech models, the AI interviewer dynamically reads your CV and conducts an interactive, spoken technical interview with zero noticeable lag.

---

## Features

- **Real-Time Voice Interaction**: Ultra-low-latency voice conversation using WebRTC, Silero VAD, Deepgram STT, and Deepgram Aura-2 / Cartesia TTS.
- **Concept Training & CV-Based Interviews**: Practice core technical concepts (backend, frontend, system design, data structures) directly without a resume, or upload your CV for a tailored interview based on your real experience.
- **Bilingual Support (English & Spanish)**: Choose between English and Spanish with native AI voices and real-time speech recognition.
- **Customizable Interview Modes**: Built-in prompts (Standard Technical, Systems Architecture, Algorithms & Code, Behavioral & Leadership) plus full custom prompt support.
- **Live Subtitles**: Visual real-time transcription and voice activity presence as you speak.
- **100% Local Control**: Runs completely on your machine—your data and audio stay under your control.

---

## Quickstart Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AUTO-interview.git
cd AUTO-interview
```

---

### 2. Get Your API Keys

You need API credentials for Speech-to-Text / Text-to-Speech and an LLM provider:

#### Deepgram (STT & TTS — Free $200 Credits)
1. Go to [Deepgram](https://deepgram.com/) and create a free account.
2. **Deepgram provides $200 in free credits with NO credit card required**.
3. Create an API key in the Deepgram Console.
4. This key can power both your **Speech-to-Text (STT)** with Nova-2 and **Text-to-Speech (TTS)** with Deepgram Aura-2 (`aura-2-nestor-es`).

#### LLM Provider (NVIDIA NIM or OpenAI)
- **NVIDIA NIM (Recommended / Free Credits)**: Sign up at [NVIDIA build](https://build.nvidia.com/) to get free trial credits and generate an API key for fast models (e.g., Llama 3 / Nemotron).
- **OpenAI**: Alternatively, provide an `OPENAI_API_KEY` (uses `gpt-4o-mini`).

---

### 3. Configure the Environment (`.env`)

Copy `.env-example` into a new `.env` file at the root of the project:

```bash
cp .env-example .env
```

Open `.env` and fill in your keys

```dotenv
# LLM Provider (choose NVIDIA NIM or OpenAI)
NVIDIA_API_KEY=your_nvidia_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# Speech-to-Text & Text-to-Speech via Deepgram ($200 free tier)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
TTS_PROVIDER=deepgram
DEEPGRAM_VOICE_ID=aura-2-nestor-es

# Optional: Cartesia TTS (if you prefer Cartesia voices)
# CARTESIA_API_KEY=your_cartesia_api_key_here
# CARTESIA_VOICE_ID=
```

---

### 4. Run the Backend

The backend is built with **FastAPI** and **Pipecat** (requires Python 3.12+).

Using [uv](https://github.com/astral-sh/uv) (recommended):
```bash
cd backend
uv sync
uv run start
```

Or using standard `venv` & `pip`:
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -e .
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will start on `http://127.0.0.1:8000`. You can verify it by opening `http://127.0.0.1:8000/docs`.

---

### 5. Run the Frontend

The frontend is built with **React**, **Vite**, and **Tailwind CSS**.

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How to Create & Start an Interview

1. **Select Language & Practice Focus**:
   - Choose between **Español** and **English**.
   - Choose your interview focus: **Pure Technical Concepts**, **Resume & Experience**, **System Design**, **Behavioral (STAR)**, or **Custom Topic** (e.g., Docker, PostgreSQL, Concurrency in Go).
2. **Resume / CV (Optional for Concept Practice)**:
   - If you want questions tailored to your experience, drag and drop your CV (**PDF** or **DOCX**).
   - If you choose a concept practice mode, uploading a CV is completely optional.
3. **Select or Customize the Interview Prompt**:
   - **Standard Technical**: Balanced technical assessment on skills and concepts.
   - **Architecture & Systems**: Focuses on system design, trade-offs, scalability, and distributed systems.
   - **Algorithms & Code**: Focuses on problem-solving, logic, and complexity trade-offs.
   - **Behavioral & Leadership**: Explores teamwork, conflict resolution, and communication using the STAR method.
   - **Custom**: Customize the prompt completely to simulate any specific role, company, or interviewer personality.
4. **Grant Microphone Access & Begin**:
   - Click **"Comenzar Entrevista" / "Start Interview"**.
   - Allow microphone permissions in your browser.
   - Speak naturally with the AI interviewer just like in a real technical screening!
5. **Dynamic Focus & Language Changes During Call**:
   - Change your language or switch topics (e.g. from CV to backend concepts) mid-call via the control buttons.
   - End the call at any time when you finish practicing.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, `@pipecat-ai/client-react`, `@pipecat-ai/client-js`.
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pipecat AI framework.
- **Audio & Pipeline**: WebRTC, Silero VAD, Deepgram STT (Nova-2), Deepgram Aura-2 / Cartesia TTS.
- **Document Processing**: `pypdf`, `python-docx`.

---

## License

This project is open source and available under the [MIT License](LICENSE).
