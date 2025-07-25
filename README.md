# 🍖 Calculadora de Parrillada "AmiAsado"

Una aplicación web simple y potente para calcular las cantidades de carne y extras necesarios para un asado, basado en el número y tipo de comensales. El proyecto está completamente dockerizado para un despliegue y desarrollo sencillos.

## ✨ Características Principales

* **Cálculo Dinámico:** Estima las cantidades de comida según el número de hombres, mujeres y niños.
* **Lista de Compras:** Genera un resumen claro de los ítems y sus cantidades necesarias.
* **Exportación a PDF:** Permite descargar la lista de compras en un práctico archivo PDF.
* **Panel de Administración:** Incluye una página de administración simple para agregar o eliminar los tipos de carnes y extras disponibles.
* **Arquitectura Moderna:** Construido sobre una base de microservicios con un backend en FastAPI, un frontend estático y NGINX como reverse proxy.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Python 3.10, FastAPI
* **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript
* **Reverse Proxy:** NGINX
* **Contenerización:** Docker, Docker Compose

## 📂 Estructura del Proyecto

```

/amiasado
|
├── backend/
│   ├── main.py             \# Lógica de la API con FastAPI
│   ├── Dockerfile          \# Instrucciones para construir la imagen del backend
│   ├── requirements.txt    \# Dependencias de Python
│   ├── config\_items.json   \# Base de datos de carnes y extras
│   └── parrillada.conf     \# Configuración de pesos y porcentajes
│
├── frontend/
│   ├── index.html          \# Página principal de la calculadora
│   ├── admin.html          \# Página de administración de ítems
│   └── script.js           \# Lógica del frontend
│
├── nginx/
│   └── nginx.conf          \# Configuración de NGINX como reverse proxy
│
└── docker-compose.yml      \# Orquestador de los servicios

````

## 🚀 Puesta en Marcha

Para ejecutar este proyecto en tu entorno local, solo necesitas tener instalados Docker y Docker Compose.

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/fedecriscuolo/amiasado.git](https://github.com/fedecriscuolo/amiasado.git)
    ```

2.  **Navega a la carpeta del proyecto:**
    ```bash
    cd amiasado
    ```

3.  **Construye y levanta los contenedores:**
    Este comando creará las imágenes de Docker y ejecutará los servicios en segundo plano (`-d`).
    ```bash
    docker-compose up --build -d
    ```

¡Y listo! La aplicación estará disponible.

## 💻 Uso

* **Calculadora Principal:** Abre tu navegador y visita [**http://localhost:8080**](http://localhost:8080)
* **Panel de Administración:** Para gestionar los ítems, visita [**http://localhost:8080/admin.html**](http://localhost:8080/admin.html)

Para detener la aplicación, ejecuta el siguiente comando en la terminal:
```bash
docker-compose down
````

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

-----

Creado por **Federico Criscuolo**.

```
