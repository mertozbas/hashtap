FROM python:3.11-slim

# OCI labels
LABEL org.opencontainers.image.title="HashTap CEO AI Bot"
LABEL org.opencontainers.image.description="Strands agent — restaurant owner assistant"

WORKDIR /app

# Sistem bağımlılıkları (httpx + websockets için yeterli)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pip cache + non-root
RUN useradd -m -u 1000 ceo && mkdir -p /app/sessions && chown -R ceo:ceo /app

COPY --chown=ceo:ceo pyproject.toml ./
COPY --chown=ceo:ceo src ./src

USER ceo

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e .

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=4200

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:4200/health', timeout=3)" || exit 1

CMD ["python", "-m", "src.main"]
