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

## How to use other LLMs or TTS/STT providers

I've configured Nvidia's free LLM model: `nvidia/nemotron-3.5-bolt-e4b`, which is available on a free account on [NVIDIA Build](https://build.nvidia.com/).

If you want to use your own models using your API Keys, just modify the `.env` file adding the API key, and adapt the configuration in [`backend/app/agent/bot.py`](backend/app/agent/bot.py):

### 1. Changing the LLM Model / Provider

In `backend/app/agent/bot.py` (around lines 83–97), you will find the LLM initialization block:

```python
# 3. LLM: NVIDIA NIM (Llama / Nemotron) or OpenAI
if nvidia_key and not openai_key:
    logger.info("Usando NVIDIA NIM LLM (nvidia/nemotron-3.5-bolt-e4b) para el entrevistador.")
    llm = OpenAILLMService(
        api_key=nvidia_key,
        base_url="https://integrate.api.nvidia.com/v1",
        settings=OpenAILLMService.Settings(model="nvidia/nemotron-3.5-bolt-e4b"),
    )
else:
    logger.info("Usando OpenAI LLM (gpt-4o-mini) para el entrevistador.")
    llm = OpenAILLMService(
        api_key=openai_key,
        settings=OpenAILLMService.Settings(model="gpt-4o-mini"),
    )
```

#### How to switch options:

- **Using a different NVIDIA NIM model (e.g. Llama 3.1 70B):**
  Keep `NVIDIA_API_KEY` in `.env` and simply change the `model` parameter:
  ```python
  settings=OpenAILLMService.Settings(model="meta/llama-3.1-70b-instruct")
  ```
- **Using OpenAI (e.g. GPT-4o or GPT-4o-mini):**
  Add `OPENAI_API_KEY=sk-...` to your `.env` (and leave `NVIDIA_API_KEY` empty or commented out). You can adjust the model:
  ```python
  settings=OpenAILLMService.Settings(model="gpt-4o")  # or "gpt-4o-mini"
  ```
- **Using Groq, Together AI, or a Local Ollama model:**
  Since `OpenAILLMService` is compatible with any OpenAI-compatible API, you only need to modify `base_url` and `model`:
  ```python
  # Example: Groq
  llm = OpenAILLMService(
      api_key=os.getenv("GROQ_API_KEY"),
      base_url="https://api.groq.com/openai/v1",
      settings=OpenAILLMService.Settings(model="llama-3.3-70b-versatile"),
  )

  # Example: Local Ollama
  llm = OpenAILLMService(
      api_key="ollama",
      base_url="http://localhost:11434/v1",
      settings=OpenAILLMService.Settings(model="llama3.1"),
  )
  ```

---

### 2. Changing the TTS (Text-to-Speech) Provider & Voice

The application supports multiple TTS providers. You can select your provider directly in `.env`:

```dotenv
# Options: deepgram, cartesia, or openai
TTS_PROVIDER=deepgram
```

In `backend/app/agent/bot.py` (lines 99–150):

- **Deepgram Aura-2 (Recommended — Free $200 Tier):**
  Set `TTS_PROVIDER=deepgram` in `.env`.
  - Spanish voice: `DEEPGRAM_VOICE_ID=aura-2-nestor-es` (or `aura-2-estrella-es`)
  - English voice: `DEEPGRAM_VOICE_ID_EN=aura-2-luna-en` (or `aura-2-orion-en`)
- **Cartesia (Ultra-low latency):**
  Set `TTS_PROVIDER=cartesia` in `.env` and specify `CARTESIA_API_KEY` and `CARTESIA_VOICE_ID`.
- **OpenAI TTS:**
  Set `TTS_PROVIDER=openai` in `.env` and provide `OPENAI_API_KEY`. In `bot.py`:
  ```python
  tts = OpenAITTSService(api_key=openai_key, voice="alloy")  # alloy, echo, fable, onyx, nova, shimmer
  ```

---

### 3. Speech-to-Text (STT)

Real-time STT is powered by Deepgram Nova-2 in `backend/app/agent/bot.py` (lines 68–81):
```python
stt = DeepgramSTTService(
    api_key=deepgram_key,
    settings=DeepgramSTTService.Settings(
        language=Language.EN if current_language == "en" else Language.ES,
        model="nova-2",
        smart_format=True,
        interim_results=True,
    ),
)
```

---

## How to Create & Start an Interview

1. **Select Language & Practice Mode**:
   - **Language**: Choose between **Español** and **English**.
   - **Two Distinct Practice Focuses**:
     - **Basado en CV (Resume-Based)**: Upload your resume (**PDF** or **DOCX**) to practice questions customized to your actual projects, tech stack, and career background.
     - **Tema Personalizado (Custom Topic)**: Practice a specific technology or concept (e.g. *Docker & Kubernetes*, *Go Concurrency*, *React 19*, *Microservices Architecture*) without uploading any CV. The CV upload is automatically omitted in this mode.
2. **Select or Customize the Interview Prompt**:
   - **Profesor / Mentor (Teacher / Mentor)**: Pedagogical mode that politely corrects you if you hesitate or make a mistake, explaining the correct concept in 1–2 sentences before continuing.
   - **Standard Technical**: Balanced screening covering skills, architecture, and engineering principles.
   - **Architecture & Systems**: Focuses on system design, trade-offs, and scalability.
   - **Algorithms & Code**: Focuses on problem-solving, logic, and complexity trade-offs.
   - **Behavioral & Leadership**: Explores teamwork and conflict resolution using the STAR method.
   - **Custom**: Customize the prompt completely to simulate any specific company or interviewer style.
3. **Grant Microphone Access & Begin**:
   - Click **"Comenzar Entrevista" / "Start Interview"**.
   - Allow microphone permissions in your browser.
   - Converse naturally with the AI interviewer in real time with visual voice wave animations and live subtitles!
4. **Dynamic Focus & Language Changes During Call**:
   - Change your language or switch focus mode mid-call using the top control buttons.
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
