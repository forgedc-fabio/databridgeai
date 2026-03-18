# backend/Dockerfile
# Derived from: https://github.com/topoteretes/cognee/blob/main/Dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev git curl && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev || uv sync --no-dev

COPY . .

FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

# Cloud Run injects PORT env var; default to 8000 for local dev
CMD ["sh", "-c", "uvicorn cognee.api.client:app --host 0.0.0.0 --port ${PORT:-8000}"]
