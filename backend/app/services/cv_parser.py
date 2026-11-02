import io
import re
from pathlib import Path
from pypdf import PdfReader
import docx
from loguru import logger

class CVParserService:
    """
    Servicio de extracción y normalización de texto de CVs (PDF y DOCX).
    Garantiza texto limpio y libre de caracteres corruptos para inyectarlo al LLM.
    """

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts: list[str] = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            raw_text = "\n".join(text_parts)
            return CVParserService._clean_text(raw_text)
        except Exception as e:
            logger.error(f"Error parseando PDF: {e}")
            raise ValueError(f"No se pudo extraer texto del archivo PDF: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
            
            # Extraer también el texto de tablas si las hubiera
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        text_parts.append(row_text)

            raw_text = "\n".join(text_parts)
            return CVParserService._clean_text(raw_text)
        except Exception as e:
            logger.error(f"Error parseando DOCX: {e}")
            raise ValueError(f"No se pudo extraer texto del archivo DOCX: {str(e)}")

    @staticmethod
    def parse_file(filename: str, file_bytes: bytes) -> str:
        ext = Path(filename).suffix.lower()
        if ext == ".pdf":
            text = CVParserService.extract_text_from_pdf(file_bytes)
        elif ext in [".docx", ".doc"]:
            text = CVParserService.extract_text_from_docx(file_bytes)
        else:
            raise ValueError(f"Extensión no permitida: {ext}. Solo se admiten .pdf y .docx")

        if not text or len(text.strip()) < 30:
            raise ValueError(
                "El documento parece estar vacío o ser una imagen sin capa de texto seleccionable."
            )

        return text

    @staticmethod
    def _clean_text(text: str) -> str:
        text = re.sub(r"\r\n|\r", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()
