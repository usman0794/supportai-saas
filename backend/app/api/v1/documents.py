import os
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db

from app.models.chatbot import Chatbot
from app.models.document import Document
from app.models.document_chunk import DocumentChunk

from app.schemas.document import DocumentResponse

from app.services.supabase import supabase
from app.services.document_processor import (
    extract_text,
    clean_text,
    chunk_text,
)
from app.services.vector_store import store_document_chunks


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post(
    "/upload/{chatbot_id}",
    response_model=DocumentResponse,
    status_code=201,
)
def upload_document(
    chatbot_id: UUID,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Get the logged-in user's ID from the JWT token.
    owner_id = UUID(user_id)

    # Make sure this chatbot belongs to the logged-in user.
    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found",
        )

    # Only allow formats supported by our document processor.
    allowed_types = {
        "application/pdf": "pdf",
        "text/plain": "txt",
        "text/markdown": "md",
    }

    file_type = allowed_types.get(file.content_type)

    if not file_type:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, TXT, and Markdown files are allowed",
        )

    # Create a unique storage name so files never overwrite each other.
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Keep each chatbot's files inside its own storage folder.
    storage_path = f"{chatbot_id}/{unique_filename}"

    try:
        # Read the file once so we can store and process the same content.
        file_content = file.file.read()

        # Store the original file in private Supabase Storage.
        supabase.storage.from_("documents").upload(
            storage_path,
            file_content,
            {
                "content-type": file.content_type,
            },
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(error)}",
        )

    # Create the document record in PostgreSQL.
    document = Document(
        chatbot_id=chatbot_id,
        filename=file.filename or unique_filename,
        file_type=file_type,
        storage_path=storage_path,
        status="pending",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        # Extract readable text from the uploaded file.
        extracted_text = extract_text(
            file_content,
            file_type,
        )

        # Clean unnecessary whitespace and blank lines.
        cleaned_text = clean_text(extracted_text)

        if not cleaned_text:
            raise ValueError(
                "No readable text was found in the document"
            )

        # Split the document into overlapping chunks for RAG.
        chunks = chunk_text(
            cleaned_text,
            chunk_size=1000,
            chunk_overlap=200,
        )

        if not chunks:
            raise ValueError(
                "No text chunks could be created from the document"
            )

        # Save each text chunk in PostgreSQL.
        document_chunks = []

        for index, content in enumerate(chunks):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                content=content,
            )

            db.add(chunk)
            document_chunks.append(chunk)

        # Save the chunks so they receive their database IDs.
        db.commit()

        # Refresh the objects so their generated IDs are available.
        for chunk in document_chunks:
            db.refresh(chunk)

        # Convert the database chunks into Qdrant vectors.
        stored_count = store_document_chunks(
            document_id=str(document.id),
            chatbot_id=str(chatbot_id),
            chunks=document_chunks,
        )

        if stored_count != len(document_chunks):
            raise ValueError(
                "Not all document chunks were stored in Qdrant"
            )

        # Everything succeeded, so mark the document as processed.
        document.status = "processed"
        document.error_message = None

        db.commit()
        db.refresh(document)

    except Exception as error:
        # Keep the document record so we can see why processing failed.
        document.status = "failed"
        document.error_message = str(error)

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(error)}",
        )

    return document


@router.get(
    "/chunks/{document_id}",
)
def get_document_chunks(
    document_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Only the chatbot owner can inspect its document chunks.
    owner_id = UUID(user_id)

    chunks = (
        db.query(DocumentChunk)
        .join(
            Document,
            DocumentChunk.document_id == Document.id,
        )
        .join(
            Chatbot,
            Document.chatbot_id == Chatbot.id,
        )
        .filter(
            DocumentChunk.document_id == document_id,
            Chatbot.owner_id == owner_id,
        )
        .order_by(
            DocumentChunk.chunk_index.asc()
        )
        .all()
    )

    return [
        {
            "id": str(chunk.id),
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
        }
        for chunk in chunks
    ]


@router.get(
    "/{chatbot_id}",
    response_model=list[DocumentResponse],
)
def get_documents(
    chatbot_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Get the logged-in user's ID from the JWT token.
    owner_id = UUID(user_id)

    # Make sure this chatbot belongs to the logged-in user.
    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found",
        )

    # Return all documents belonging to this chatbot.
    return (
        db.query(Document)
        .filter(
            Document.chatbot_id == chatbot_id
        )
        .order_by(
            Document.created_at.desc()
        )
        .all()
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Get the logged-in user's ID from the JWT token.
    owner_id = UUID(user_id)

    # Find the document and verify chatbot ownership.
    document = (
        db.query(Document)
        .join(
            Chatbot,
            Document.chatbot_id == Chatbot.id,
        )
        .filter(
            Document.id == document_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    try:
        # Remove the original file from Supabase Storage.
        supabase.storage.from_("documents").remove(
            [document.storage_path]
        )
    except Exception:
        # Database cleanup can still continue if storage removal fails.
        pass

    # Delete the document and its chunks through the database cascade.
    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully",
    }