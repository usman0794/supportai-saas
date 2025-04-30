from app.services.document_processor import (
    clean_text,
    chunk_text,
    extract_text,
)


# Test the text extraction function.
with open("test.txt", "rb") as file:
    file_content = file.read()

text = extract_text(file_content, "txt")

print("\n--- Extracted Text ---")
print(text)


# Test text cleaning.
cleaned_text = clean_text(text)

print("\n--- Cleaned Text ---")
print(cleaned_text)


# Test text chunking.
chunks = chunk_text(
    cleaned_text,
    chunk_size=50,
    chunk_overlap=10,
)

print("\n--- Chunks ---")

for index, chunk in enumerate(chunks, start=1):
    print(f"\nChunk {index}:")
    print(chunk)