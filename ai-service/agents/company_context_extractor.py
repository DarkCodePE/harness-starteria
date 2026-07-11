"""Company context extraction worker.

Sources are untrusted data. This module never executes instructions found in
documents or websites; it only classifies visible text into structured context
dimensions for human review.
"""

from __future__ import annotations

import base64
import io
import re
import zipfile
from typing import Any

from schemas.responses import ContextExtractEntry, ContextExtractResponse

MODEL_ID = "heuristic/company-context-v1"


def _clip(text: str, limit: int = 1200) -> str:
    return re.sub(r"\s+", " ", text).strip()[:limit]


def _entry(dimension: str, field_key: str, value: Any, confidence: float) -> ContextExtractEntry:
    return ContextExtractEntry(
        dimension=dimension,
        fieldKey=field_key,
        value=value,
        confidence=confidence,
        verificationStatus="INFERRED",
    )


def _sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+", text)
    return [_clip(chunk, 500) for chunk in chunks if len(chunk.strip()) > 40]


def _match_any(text: str, words: list[str]) -> bool:
    low = text.lower()
    return any(word in low for word in words)


def extract_context(clean_content: str, source_type: str, title: str | None = None, url: str | None = None) -> ContextExtractResponse:
    text = _clip(clean_content, 80_000)
    sentences = _sentences(text)
    entries: list[ContextExtractEntry] = []
    warnings: list[str] = []

    if title:
        entries.append(_entry("IDENTITY", "publicTitle", title, 0.55))
    if url:
        entries.append(_entry("IDENTITY", "publicUrl", url, 0.5))

    culture = [s for s in sentences if _match_any(s, ["cultura", "valores", "proposito", "propósito", "personas", "equipo"])]
    if culture:
        entries.append(_entry("CULTURE", "publicSignals", culture[:5], 0.48))

    structure = [s for s in sentences if _match_any(s, ["gerencia", "comite", "comité", "directorio", "areas", "áreas", "organizacion", "organización"])]
    if structure:
        entries.append(_entry("STRUCTURE", "publicDecisionSignals", structure[:5], 0.45))

    policies = [s for s in sentences if _match_any(s, ["politica", "política", "cumplimiento", "compliance", "seguridad", "legal", "riesgo"])]
    if policies:
        entries.append(_entry("POLICIES", "publicPolicySignals", policies[:5], 0.44))

    innovation = [s for s in sentences if _match_any(s, ["innovacion", "innovación", "piloto", "transformacion", "transformación", "digital", "i+d"])]
    if innovation:
        entries.append(_entry("INNOVATION", "publicInnovationSignals", innovation[:5], 0.5))

    resources = [s for s in sentences if _match_any(s, ["tecnologia", "tecnología", "datos", "presupuesto", "capacidad", "proveedores", "infraestructura"])]
    if resources:
        entries.append(_entry("RESOURCES", "publicResourceSignals", resources[:5], 0.42))

    if source_type == "LINKEDIN" and not entries:
        warnings.append("LinkedIn no entrego contenido suficiente para clasificar.")

    missing = [
        label
        for label, dim in [
            ("cultura interna confirmada por usuario", "CULTURE"),
            ("roles de aprobacion", "STRUCTURE"),
            ("validaciones internas", "POLICIES"),
            ("criterios para escalar pilotos", "INNOVATION"),
            ("recursos disponibles", "RESOURCES"),
        ]
        if not any(entry.dimension == dim for entry in entries)
    ]
    summary = _clip(text, 700) if text else "No se pudo extraer texto util."
    return ContextExtractResponse(
        entries=entries,
        summary=summary,
        missing=missing,
        warnings=warnings,
        tokensUsed=max(1, len(text) // 4),
        model=MODEL_ID,
        estimatedCost=0.0,
    )


def extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join((page.extract_text() or "").strip() for page in reader.pages)
    except Exception:
        return ""


def extract_docx(data: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
        text = re.sub(r"</w:p>", "\n", xml)
        text = re.sub(r"<[^>]+>", " ", text)
        return _clip(text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"), 1_500_000)
    except Exception:
        return ""


def extract_file(file_base64: str, mime_type: str, file_name: str) -> tuple[str, str]:
    data = base64.b64decode(file_base64, validate=True)
    lower = file_name.lower()
    if mime_type == "application/pdf" or lower.endswith(".pdf"):
        text = extract_pdf(data)
    elif "wordprocessingml.document" in mime_type or lower.endswith(".docx"):
        text = extract_docx(data)
    elif mime_type in {"text/markdown", "text/plain"} or lower.endswith(".md"):
        text = data.decode("utf-8", errors="ignore")
    else:
        text = ""
    return text, _clip(text, 1_500_000)
