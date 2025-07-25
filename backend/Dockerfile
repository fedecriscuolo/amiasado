# Imagen base oficial de Python
FROM python:3.10-slim

# Establecer directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos necesarios
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos del backend
COPY main.py .
COPY config_items.json .
COPY parrillada.conf .

# Exponer el puerto donde corre FastAPI
EXPOSE 8000

# Comando por defecto para ejecutar FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
