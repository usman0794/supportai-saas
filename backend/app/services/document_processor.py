import io
import os

from pypdf import PdfReader


def extract_text(file_content: bytes, file_type: str) -> str:
    # Extract readable text based on the uploaded file type.
    if file_type == "txt" or file_type == "md":
        return file_content.decode("utf-8", errors="ignore").strip()

    if file_type == "pdf":
        # Read PDF pages and combine their text into one string.
        reader = PdfReader(io.BytesIO(file_content))

        pages = []

        for page in reader.pages:
            text = page.extract_text() or ""

            if text.strip():
                pages.append(text.strip())

        return "\n\n".join(pages).strip()

    raise ValueError("Unsupported document type")


def clean_text(text: str) -> str:
    # Remove extra spaces and unnecessary blank lines.
    lines = [line.strip() for line in text.splitlines()]

    cleaned_lines = [
        line for line in lines
        if line
    ]

    return "\n".join(cleaned_lines)


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[str]:
    # Split long text into smaller overlapping pieces for AI search.
    if not text:
        return []

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start = end - chunk_overlap

    return chunks