"""Company context extraction worker.

Sources are untrusted data. This module never executes instructions found in
documents or websites; it only classifies visible text into structured context
dimensions for human review.

CC-04: `extract_context` intenta primero el chain LLM (`company_context_llm`,
patrón field_refiner) y ante CUALQUIER fallo degrada a la heurística de
keywords original (`_extract_context_heuristic`), así el endpoint nunca pierde
la fiabilidad previa. `verificationStatus="INFERRED"` se fuerza server-side en
ambas rutas; el campo `model` de la respuesta reporta qué ruta respondió.
"""

from __future__ import annotations

import base64
import io
import logging
import re
import zipfile
from typing import Any

from schemas.responses import ContextExtractEntry, ContextExtractResponse

logger = logging.getLogger(__name__)

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
    # Umbral 20 (antes 40): oraciones cortas pero informativas como
    # "Nuestra cultura promueve innovacion." (36 chars) se descartaban y la
    # dimensión CULTURE nunca clasificaba.
    return [_clip(chunk, 500) for chunk in chunks if len(chunk.strip()) > 20]


def _match_any(text: str, words: list[str]) -> bool:
    low = text.lower()
    return any(word in low for word in words)


def extract_context(clean_content: str, source_type: str, title: str | None = None, url: str | None = None) -> ContextExtractResponse:
    """Ruta pública: LLM primero, heurística como fallback (CC-04)."""
    try:
        return _extract_context_llm(clean_content, source_type, title, url)
    except Exception as exc:  # noqa: BLE001 — la heurística es el piso de fiabilidad
        logger.warning("context-extract LLM failed, falling back to heuristic: %s", exc)
        return _extract_context_heuristic(clean_content, source_type, title, url)


def _extract_context_llm(clean_content: str, source_type: str, title: str | None, url: str | None) -> ContextExtractResponse:
    # Import perezoso: mantiene el módulo importable (y la heurística usable)
    # aunque langchain/openai no estén disponibles en el entorno.
    from agents.company_context_llm import MAX_PROMPT_CHARS, extract_context_llm, llm_model_id

    result = extract_context_llm(clean_content, source_type, title=title, url=url)
    entries: list[ContextExtractEntry] = []
    if title:
        entries.append(_entry("IDENTITY", "publicTitle", title, 0.55))
    if url:
        entries.append(_entry("IDENTITY", "publicUrl", url, 0.5))
    for item in result.entries[:12]:
        # _entry fuerza verificationStatus="INFERRED" pase lo que pase el modelo.
        entries.append(_entry(item.dimension, item.fieldKey, item.value, max(0.0, min(item.confidence, 1.0))))
    prompt_chars = min(len(clean_content or ""), MAX_PROMPT_CHARS)
    return ContextExtractResponse(
        entries=entries,
        summary=_clip(result.summary, 700) or "No se pudo extraer texto util.",
        missing=[_clip(m, 200) for m in result.missing[:10]],
        warnings=[],
        tokensUsed=max(1, prompt_chars // 4),
        model=llm_model_id(),
        estimatedCost=round(prompt_chars / 4 / 1000 * 0.00025, 6),
    )


def _extract_context_heuristic(clean_content: str, source_type: str, title: str | None = None, url: str | None = None) -> ContextExtractResponse:
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
    elif mime_type in {"text/markdown", "text/plain"} or lower.endswith((".md", ".txt", ".text", ".markdown")):
        # .txt/.md por MIME o por extensión (un .txt puede llegar como octet-stream/sin MIME).
        text = data.decode("utf-8", errors="ignore")
    else:
        text = ""
    return text, _clip(text, 1_500_000)
