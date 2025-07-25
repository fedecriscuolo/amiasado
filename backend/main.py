from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fpdf import FPDF
import pandas as pd
import configparser
import uuid
import json
import os
from fastapi import Query


app = FastAPI(
    title="Calculadora de Parrillada",
    description="API para estimar carnes y extras en base a comensales. Backend en FastAPI.",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = "parrillada.conf"
ITEMS_FILE = "config_items.json"
EXPORT_FOLDER = "exports"
os.makedirs(EXPORT_FOLDER, exist_ok=True)

class ItemsInput(BaseModel):
    carnes: list[str] = []
    extras: list[str] = []

class ItemsDelete(BaseModel):
    carnes: list[str] = []
    extras: list[str] = []

class Comensal(BaseModel):
    nombre: str
    tipo: str
    carnes: list
    extras: list

class ComensalesWrapper(BaseModel):
    comensales: list[Comensal]

def cargar_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    return config

def cargar_items():
    with open(ITEMS_FILE, "r") as f:
        return json.load(f)

@app.get("/api-items-asado", tags=["Items Asado"])
def obtener_items():
    return cargar_items()



## --- INICIO NUEVO FRAGMENTO --- #
#
@app.post("/api-items-asado", tags=["Items Asado"])
def agregar_items(data: ItemsInput):
    items = cargar_items()
    items["carnes"] = list(set(items["carnes"] + data.carnes))
    items["extras"] = list(set(items["extras"] + data.extras))
    with open(ITEMS_FILE, "w") as f:
        json.dump(items, f)
    return {"mensaje": "Ítems agregados correctamente"}

## --- FIN NUEVO FRAGMENTO --- #



@app.delete("/api-items-asado", tags=["Items Asado"])
def eliminar_items(
    tipo: str = Query(..., description="Tipo de ítem: carnes o extras"),
    nombre: str = Query(..., description="  Nombre del ítem")
):
    try:
        with open(ITEMS_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer archivo: {e}")

    key = "carnes" if tipo == "carne" else "extras"

    if key not in config:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    config[key] = [i for i in config[key] if i.lower() != nombre.lower()]

    try:
        with open(ITEMS_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar archivo: {e}")
    
    return {"mensaje": f"{nombre} eliminado correctamente"}

##########################################


@app.post("/api-calculadora-asado", tags=["Cálculo Parrilla"])
def calcular_cantidades(wrapper: ComensalesWrapper):
    config = cargar_config()
    items = cargar_items()
    totales = dict(config["totales"])
    porcentajes = dict(config["porcentajes"])
    extras_config = dict(config["extras"])

    resumen = {}

    for c in wrapper.comensales:
        tipo = c.tipo.lower()
        total_grs = int(totales[tipo])
        carnes_elegidas = c.carnes or items["carnes"]
        porcentaje_total = sum([int(porcentajes[i]) for i in carnes_elegidas])

        # Calcular carnes
        for carne in carnes_elegidas:
            grs = total_grs * int(porcentajes[carne]) / porcentaje_total
            resumen[carne] = resumen.get(carne, 0) + grs

        # Calcular extras
        for extra in c.extras:
            clave_extra = f"{extra.lower()}_{tipo}"
            if clave_extra in extras_config:
                resumen[extra] = resumen.get(extra, 0) + int(extras_config[clave_extra])

        with open(os.path.join(EXPORT_FOLDER, "ultimo_comensales.json"), "w") as f:
            json.dump(wrapper.dict(), f)


    return {"lista_compras": resumen}

@app.post("/api-calculadora-asado/exportar-pdf", tags=["Cálculo Parrilla"])
def exportar_pdf(wrapper: ComensalesWrapper):
    resumen = calcular_cantidades(wrapper)["lista_compras"]
    archivo_pdf = os.path.join(EXPORT_FOLDER, f"lista_compras_{uuid.uuid4().hex}.pdf")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Lista de Compras", ln=True, align="C")
    pdf.ln(10)

    for item, cantidad in resumen.items():
        pdf.cell(200, 10, txt=f"{item}: {round(cantidad)} grs", ln=True)

    pdf.output(archivo_pdf)
    return FileResponse(archivo_pdf, filename="lista_compras.pdf")

@app.post("/api-calculadora-asado/exportar-excel", tags=["Cálculo Parrilla"])
def exportar_excel(wrapper: ComensalesWrapper):
    resumen = calcular_cantidades(wrapper)["lista_compras"]
    archivo_excel = os.path.join(EXPORT_FOLDER, f"lista_compras_{uuid.uuid4().hex}.xlsx")

    df = pd.DataFrame(list(resumen.items()), columns=["Ítem", "Cantidad (grs)"])
    df["Precio estimado"] = ""
    df.to_excel(archivo_excel, index=False)

    return FileResponse(archivo_excel, filename="lista_compras.xlsx")

@app.get("/api-calculadora-asado/resumen", tags=["Cálculo Parrilla"])
def resumen_consumo():
    config = cargar_config()
    items = cargar_items()
    totales = dict(config["totales"])
    extras = dict(config["extras"])
    porcentajes = dict(config["porcentajes"])

    # Cargar comensales de ejemplo desde archivo temporal o mock interno
    ejemplo_json_path = os.path.join(EXPORT_FOLDER, "ultimo_comensales.json")
    if not os.path.exists(ejemplo_json_path):
        raise HTTPException(status_code=404, detail="No se encontraron comensales procesados recientemente.")

    with open(ejemplo_json_path, "r") as f:
        data = json.load(f)

    comensales = data.get("comensales", [])
    total_comensales = len(comensales)

    if total_comensales == 0:
        return {
            "total_comensales": 0,
            "promedio_por_comensal": {},
            "total_grs_por_comensal": 0
        }

    acumulado = {}
    total_global = 0

    for c in comensales:
        tipo = c["tipo"].lower()
        total_grs = int(totales[tipo])
        carnes_elegidas = c["carnes"] or items["carnes"]
        porcentaje_total = sum([int(porcentajes[i]) for i in carnes_elegidas])

        # Carnes
        for carne in carnes_elegidas:
            grs = total_grs * int(porcentajes[carne]) / porcentaje_total
            acumulado[carne] = acumulado.get(carne, 0) + grs
            total_global += grs


        # Extras
        for extra in c["extras"]:
            clave_extra = f"{extra.lower()}_{tipo}"
            if clave_extra in extras:
                grs = int(extras[clave_extra])
                acumulado[extra] = acumulado.get(extra, 0) + grs
                total_global += grs

    promedio_por_comensal = {
        k.capitalize(): round(v / total_comensales / 1000, 3)  # kilos/persona
        for k, v in acumulado.items()
    }

    total_grs_por_comensal = round(total_global / total_comensales / 1000, 2)

    return {
        "total_comensales": total_comensales,
        "promedio_por_comensal": promedio_por_comensal,
        "total_grs_por_comensal": total_grs_por_comensal
    }

