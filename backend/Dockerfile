# Use slim Python base — avoids ~500MB of extras
FROM python:3.11-slim

WORKDIR /app

# Install system deps spaCy needs
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only FIRST (before other deps)
# This is the key step — prevents pip from pulling the full CUDA build
RUN pip install --no-cache-dir \
    torch --index-url https://download.pytorch.org/whl/cpu

# Now install the rest of your dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model at build time
RUN python -m spacy download en_core_web_md

COPY . .

EXPOSE 5000

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--timeout", "600"]