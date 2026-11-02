from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.api.routes.interview import router as interview_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend para AutoInterview AI: Procesamiento de CVs y Orquestación de Agente Pipecat.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Habilitar CORS para permitir peticiones desde React / Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar routers
app.include_router(interview_router, prefix="/api")

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

def start():
    """Entrypoint para ejecutar el servidor con 'uv run start' o comando python"""
    import uvicorn
    logger.info("Iniciando FastAPI en http://127.0.0.1:8000 (Swagger docs en /docs)...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    start()
