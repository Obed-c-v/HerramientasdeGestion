"""
=============================================================
  S-Park - Exploración y Limpieza de Datasets de Parkinson
=============================================================
  Dataset 1: Oxford Parkinson's Disease Detection (parkinsons.data)
    -> Clasificación Binaria: Sano (0) vs Parkinson (1)
  
  Dataset 2: Oxford Parkinson's Telemonitoring (parkinsons_updrs.data)
    -> Clasificación Multiclase: Nivel de Riesgo (Bajo, Medio, Alto)
       basado en discretización del score total_UPDRS
=============================================================
"""

import pandas as pd
import numpy as np
import os

# ============================================================
# 1. CARGAR LOS DATASETS
# ============================================================
DATA_DIR = r"C:\Users\prueb\Downloads\Datasets\data oxfort"

print("=" * 60)
print("  CARGANDO DATASETS...")
print("=" * 60)

# Dataset 1: Oxford (Clasificación Binaria)
df_oxford = pd.read_csv(os.path.join(DATA_DIR, "parkinsons.data"))
print(f"\n✅ Dataset Oxford cargado: {df_oxford.shape[0]} filas x {df_oxford.shape[1]} columnas")

# Dataset 2: UPDRS (Telemonitoring)
df_updrs = pd.read_csv(os.path.join(DATA_DIR, "parkinsons_updrs.data"))
print(f"✅ Dataset UPDRS cargado:  {df_updrs.shape[0]} filas x {df_updrs.shape[1]} columnas")

# ============================================================
# 2. EXPLORAR DATASET OXFORD (parkinsons.data)
# ============================================================
print("\n" + "=" * 60)
print("  DATASET 1: OXFORD (Clasificación Binaria)")
print("=" * 60)

print("\n--- Columnas ---")
print(df_oxford.columns.tolist())

print("\n--- Primeras 5 filas ---")
print(df_oxford.head())

print("\n--- Tipos de Datos ---")
print(df_oxford.dtypes)

print("\n--- Valores Nulos por Columna ---")
nulos_oxford = df_oxford.isnull().sum()
print(nulos_oxford[nulos_oxford > 0] if nulos_oxford.sum() > 0 else "✅ No hay valores nulos")

print("\n--- Estadísticas Generales ---")
print(df_oxford.describe())

print("\n--- Distribución de la Variable Objetivo (status) ---")
print(df_oxford['status'].value_counts())
print(f"   Parkinson (1): {df_oxford['status'].sum()} muestras ({df_oxford['status'].mean()*100:.1f}%)")
print(f"   Sano      (0): {(df_oxford['status'] == 0).sum()} muestras ({(1-df_oxford['status'].mean())*100:.1f}%)")

print("\n--- Columnas a ELIMINAR (no son features útiles para el modelo) ---")
print("   'name' -> Es solo el identificador del sujeto y número de grabación")

# ============================================================
# 3. EXPLORAR DATASET UPDRS (parkinsons_updrs.data)
# ============================================================
print("\n" + "=" * 60)
print("  DATASET 2: UPDRS (Telemonitoring - Clasificación Multiclase)")
print("=" * 60)

print("\n--- Columnas ---")
print(df_updrs.columns.tolist())

print("\n--- Primeras 5 filas ---")
print(df_updrs.head())

print("\n--- Tipos de Datos ---")
print(df_updrs.dtypes)

print("\n--- Valores Nulos por Columna ---")
nulos_updrs = df_updrs.isnull().sum()
print(nulos_updrs[nulos_updrs > 0] if nulos_updrs.sum() > 0 else "✅ No hay valores nulos")

print("\n--- Estadísticas del total_UPDRS (Variable a Discretizar) ---")
print(df_updrs['total_UPDRS'].describe())

print("\n--- Distribución propuesta de Niveles de Riesgo ---")
df_updrs['nivel_riesgo'] = pd.cut(
    df_updrs['total_UPDRS'],
    bins=[0, 25, 40, float('inf')],
    labels=['BAJO', 'MEDIO', 'ALTO']
)
print(df_updrs['nivel_riesgo'].value_counts().sort_index())

print("\n--- Columnas a ELIMINAR (no son features de voz) ---")
print("   'subject#' -> Identificador del sujeto")
print("   'age'      -> Dato demográfico, no acústico")
print("   'sex'      -> Dato demográfico, no acústico")
print("   'test_time' -> Tiempo desde reclutamiento, no acústico")
print("   'motor_UPDRS' -> Score clínico (no es feature de entrada)")
print("   'total_UPDRS' -> Score clínico (se usa para crear la etiqueta, luego se quita)")

# ============================================================
# 4. LIMPIEZA - DATASET OXFORD
# ============================================================
print("\n" + "=" * 60)
print("  LIMPIEZA: DATASET OXFORD")
print("=" * 60)

# Eliminar columna 'name' (no es un feature)
df_oxford_clean = df_oxford.drop(columns=['name'])

# Separar features (X) y target (y)
X_oxford = df_oxford_clean.drop(columns=['status'])
y_oxford = df_oxford_clean['status']

print(f"✅ Features (X): {X_oxford.shape[1]} columnas")
print(f"   Columnas: {X_oxford.columns.tolist()}")
print(f"✅ Target (y):   {y_oxford.nunique()} clases -> {y_oxford.value_counts().to_dict()}")

# Verificar duplicados
dupes = df_oxford_clean.duplicated().sum()
print(f"\n   Duplicados encontrados: {dupes}")
if dupes > 0:
    df_oxford_clean = df_oxford_clean.drop_duplicates()
    print(f"   ✅ Eliminados. Nuevo tamaño: {df_oxford_clean.shape[0]} filas")

# ============================================================
# 5. LIMPIEZA - DATASET UPDRS
# ============================================================
print("\n" + "=" * 60)
print("  LIMPIEZA: DATASET UPDRS")
print("=" * 60)

# Columnas a eliminar (demográficas y scores clínicos)
cols_to_drop = ['subject#', 'age', 'sex', 'test_time', 'motor_UPDRS', 'total_UPDRS']
df_updrs_clean = df_updrs.drop(columns=cols_to_drop)

# Separar features (X) y target (y)
X_updrs = df_updrs_clean.drop(columns=['nivel_riesgo'])
y_updrs = df_updrs_clean['nivel_riesgo']

print(f"✅ Features (X): {X_updrs.shape[1]} columnas")
print(f"   Columnas: {X_updrs.columns.tolist()}")
print(f"✅ Target (y):   {y_updrs.nunique()} clases -> {y_updrs.value_counts().to_dict()}")

# Verificar duplicados
dupes = df_updrs_clean.duplicated().sum()
print(f"\n   Duplicados encontrados: {dupes}")
if dupes > 0:
    df_updrs_clean = df_updrs_clean.drop_duplicates()
    X_updrs = df_updrs_clean.drop(columns=['nivel_riesgo'])
    y_updrs = df_updrs_clean['nivel_riesgo']
    print(f"   ✅ Eliminados. Nuevo tamaño: {df_updrs_clean.shape[0]} filas")

# Guardar los datasets limpios
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)
df_oxford_clean.to_csv(os.path.join(OUTPUT_DIR, "oxford_clean.csv"), index=False)
df_updrs_clean.to_csv(os.path.join(OUTPUT_DIR, "updrs_clean.csv"), index=False)
print(f"\n💾 Datasets limpios guardados en: {OUTPUT_DIR}")

# ============================================================
# 6. RESUMEN FINAL
# ============================================================
print("\n" + "=" * 60)
print("  RESUMEN FINAL DE DATOS LISTOS PARA ENTRENAMIENTO")
print("=" * 60)

print(f"""
  📊 Dataset Oxford (Clasificación Binaria):
     - Muestras: {X_oxford.shape[0]}
     - Features: {X_oxford.shape[1]}
     - Clases:   Sano (0) = {(y_oxford == 0).sum()}, Parkinson (1) = {(y_oxford == 1).sum()}

  📊 Dataset UPDRS (Clasificación Multiclase):
     - Muestras: {X_updrs.shape[0]}
     - Features: {X_updrs.shape[1]}
     - Clases:   Bajo = {(y_updrs == 'BAJO').sum()}, Medio = {(y_updrs == 'MEDIO').sum()}, Alto = {(y_updrs == 'ALTO').sum()}

  ✅ Los datos están limpios y listos para el entrenamiento.
  ➡️  Siguiente paso: Ejecutar train_models.py para entrenar
      y comparar los 3 algoritmos.
""")
