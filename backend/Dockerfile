# Build context = REPOSITORY ROOT (render.yaml: dockerContext: .)
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY compiler/ ./compiler/

# backend resolves compiler/ as a sibling of backend/ (sys.path: <dir>/../..)
WORKDIR /app/backend

EXPOSE 10000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
