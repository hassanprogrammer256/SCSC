import os

from rest_framework import serializers

ALLOWED_SUBMISSION_EXTENSIONS = {
    ".docx": "docx",
    ".pdf": "pdf",
}
ALLOWED_SUBMISSION_MIME_TYPES = {
    "docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    "pdf": {"application/pdf"},
}
MAX_SUBMISSION_SIZE_BYTES = 20 * 1024 * 1024  # 20MB


def validate_submission_file(uploaded_file) -> str:
    """Validates extension, MIME type, and size for an assessment submission
    upload — extension and MIME are both checked since either alone can be
    spoofed by renaming a file. Returns the resolved file_type ("docx"/"pdf")
    on success. Source of truth per context/architecture.md's invariants —
    the frontend's own check is UX only.
    """
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    file_type = ALLOWED_SUBMISSION_EXTENSIONS.get(ext)
    if file_type is None:
        raise serializers.ValidationError("Only .docx and .pdf files are accepted.")

    if uploaded_file.content_type not in ALLOWED_SUBMISSION_MIME_TYPES[file_type]:
        raise serializers.ValidationError("File content does not match a valid .docx or .pdf file.")

    if uploaded_file.size > MAX_SUBMISSION_SIZE_BYTES:
        raise serializers.ValidationError("File exceeds the 20MB submission size limit.")

    return file_type
