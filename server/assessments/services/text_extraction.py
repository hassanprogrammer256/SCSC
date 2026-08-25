import logging

import docx
import pdfplumber

logger = logging.getLogger(__name__)


def extract_text(file_path: str, file_type: str) -> str | None:
    try:
        if file_type == "docx":
            document = docx.Document(file_path)
            return "\n".join(p.text for p in document.paragraphs)
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception:
        logger.exception("[assessments/text_extraction] failed for %s", file_path)
        return None
