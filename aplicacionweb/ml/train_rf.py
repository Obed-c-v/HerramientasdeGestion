"""
=============================================================
  S-Park - Entrenamiento y Evaluación: Random Forest 🌲
=============================================================
  Este script entrena dos modelos de Bosque Aleatorio:
  1. Clasificador Binario (Oxford): Detectar Parkinson (Sano vs Enfermo)
  2. Clasificador Multiclase (UPDRS): Estimar Nivel de Riesgo (Bajo, Medio, Alto)
=============================================================
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Importaciones clave de Scikit-learn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Métricas de evaluación
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    log_loss,
    roc_auc_score
)

# Definición de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "outputs")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("  ENTRENANDO MODELOS RANDOM FOREST paso a paso...")
print("=" * 60)

# ============================================================
# PASO 1: CARGA DE LOS DATASETS LIMPIOS
# ============================================================
print("\n--- PASO 1: Cargando datasets limpios ---")
df_oxford = pd.read_csv(os.path.join(DATA_DIR, "oxford_clean.csv"))
df_updrs = pd.read_csv(os.path.join(DATA_DIR, "updrs_clean.csv"))

print(f"✅ Oxford dataset cargado: {df_oxford.shape[0]} filas x {df_oxford.shape[1]} columnas")
print(f"✅ UPDRS dataset cargado:  {df_updrs.shape[0]} filas x {df_updrs.shape[1]} columnas")


# ============================================================
# PASO 2: SEPARACIÓN DE VARIABLES Y PARTICIÓN TRAIN/TEST
# ============================================================
print("\n--- PASO 2: División en Entrenamiento (80%) y Prueba (20%) ---")

# --- 2.1 Para Oxford (Detección Binaria) ---
X_ox = df_oxford.drop(columns=['status'])
y_ox = df_oxford['status']

# Dividimos usando stratified split para mantener el balance de clases en train y test
X_train_ox, X_test_ox, y_train_ox, y_test_ox = train_test_split(
    X_ox, y_ox, test_size=0.2, random_state=42, stratify=y_ox
)

# --- 2.2 Para UPDRS (Nivel de Riesgo Multiclase) ---
X_up = df_updrs.drop(columns=['nivel_riesgo'])
y_up = df_updrs['nivel_riesgo']

# Mapeamos las clases de texto a números para que los algoritmos calculen mejor las probabilidades
# BAJO -> 0, MEDIO -> 1, ALTO -> 2
class_mapping = {'BAJO': 0, 'MEDIO': 1, 'ALTO': 2}
y_up_encoded = y_up.map(class_mapping)

X_train_up, X_test_up, y_train_up, y_test_up = train_test_split(
    X_up, y_up_encoded, test_size=0.2, random_state=42, stratify=y_up_encoded
)

print(f"✅ Oxford Split -> Train: {X_train_ox.shape[0]} muestras, Test: {X_test_ox.shape[0]} muestras")
print(f"✅ UPDRS Split  -> Train: {X_train_up.shape[0]} muestras, Test: {X_test_up.shape[0]} muestras")


# ============================================================
# PASO 3: ESCALAMIENTO DE CARACTERÍSTICAS (StandardScaler)
# ============================================================
print("\n--- PASO 3: Normalización y Escalamiento de Características ---")
# Aunque los árboles de decisión y Random Forest NO se ven afectados por la escala de los datos,
# en el pipeline final y para comparar justamente con SVM (que sí es altamente sensible a la escala),
# entrenaremos todos los modelos usando datos estandarizados.
# StandardScaler resta la media y divide entre la desviación estándar (z = (x - u) / s)

scaler_ox = StandardScaler()
X_train_ox_scaled = scaler_ox.fit_transform(X_train_ox)
X_test_ox_scaled = scaler_ox.transform(X_test_ox)

scaler_up = StandardScaler()
X_train_up_scaled = scaler_up.fit_transform(X_train_up)
X_test_up_scaled = scaler_up.transform(X_test_up)

# Guardamos los escaladores para usarlos después en la API (cuando llegue un audio nuevo, debemos escalarlo igual)
joblib.dump(scaler_ox, os.path.join(MODELS_DIR, "scaler_oxford.joblib"))
joblib.dump(scaler_up, os.path.join(MODELS_DIR, "scaler_updrs.joblib"))
print("💾 Escaladores guardados en la carpeta 'models/'")


# ============================================================
# PASO 4: MODELO 1 - RANDOM FOREST BINARIO (Detección de Parkinson)
# ============================================================
print("\n" + "=" * 60)
print("  ENTRENANDO MODELO 1: RANDOM FOREST BINARIO")
print("=" * 60)

# Hiperparámetros explicados:
# - n_estimators=100: Número de árboles en el bosque.
# - max_depth=8: Límite de profundidad de los árboles para evitar sobreajuste.
# - class_weight='balanced': Ajusta automáticamente los pesos inversamente proporcionales a las clases para compensar el desbalance.
# - random_state=42: Semilla para asegurar que los resultados sean reproducibles.
rf_binary = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    class_weight='balanced',
    random_state=42
)

# Entrenamiento del modelo
rf_binary.fit(X_train_ox_scaled, y_train_ox)
print("✅ Modelo entrenado exitosamente.")

# Predicciones
y_pred_ox = rf_binary.predict(X_test_ox_scaled)
y_prob_ox = rf_binary.predict_proba(X_test_ox_scaled)[:, 1] # Probabilidad de la clase positiva (Parkinson = 1)

# Cálculo de métricas
acc_ox = accuracy_score(y_test_ox, y_pred_ox)
prec_ox = precision_score(y_test_ox, y_pred_ox)
rec_ox = recall_score(y_test_ox, y_pred_ox)
f1_ox = f1_score(y_test_ox, y_pred_ox)
loss_ox = log_loss(y_test_ox, y_prob_ox)
auc_ox = roc_auc_score(y_test_ox, y_prob_ox)

print("\n📈 METRICAS DE EVALUACIÓN (TEST):")
print(f"   - Exactitud (Accuracy): {acc_ox:.4f}")
print(f"   - Precisión:            {prec_ox:.4f} (De los clasificados con Parkinson, cuántos sí tienen)")
print(f"   - Sensibilidad (Recall):{rec_ox:.4f} (De los enfermos reales, cuántos logramos detectar)")
print(f"   - F1-Score:             {f1_ox:.4f} (Balance armónico de Precisión y Recall)")
print(f"   - Log Loss:             {loss_ox:.4f} (Penalización por incertidumbre en probabilidades)")
print(f"   - AUC-ROC:              {auc_ox:.4f} (Capacidad de separar sanos de enfermos)")


# ============================================================
# PASO 5: MODELO 2 - RANDOM FOREST MULTICLASE (Nivel de Riesgo UPDRS)
# ============================================================
print("\n" + "=" * 60)
print("  ENTRENANDO MODELO 2: RANDOM FOREST MULTICLASE")
print("=" * 60)

rf_multiclass = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    class_weight='balanced',
    random_state=42
)

rf_multiclass.fit(X_train_up_scaled, y_train_up)
print("✅ Modelo entrenado exitosamente.")

# Predicciones
y_pred_up = rf_multiclass.predict(X_test_up_scaled)
y_prob_up = rf_multiclass.predict_proba(X_test_up_scaled) # Devuelve probabilidades para las 3 clases

# Cálculo de métricas multiclase
acc_up = accuracy_score(y_test_up, y_pred_up)
# Usamos average='macro' para calcular la métrica promedio por clase de forma no sesgada
prec_up = precision_score(y_test_up, y_pred_up, average='macro')
rec_up = recall_score(y_test_up, y_pred_up, average='macro')
f1_up = f1_score(y_test_up, y_pred_up, average='macro')
loss_up = log_loss(y_test_up, y_prob_up)
# Para AUC-ROC multiclase usamos One-vs-Rest (ovr)
auc_up = roc_auc_score(y_test_up, y_prob_up, multi_class='ovr', average='macro')

print("\n📈 METRICAS DE EVALUACIÓN (TEST):")
print(f"   - Exactitud (Accuracy): {acc_up:.4f}")
print(f"   - Macro Precisión:      {prec_up:.4f}")
print(f"   - Macro Sensibilidad:   {rec_up:.4f}")
print(f"   - Macro F1-Score:       {f1_up:.4f}")
print(f"   - Log Loss:             {loss_up:.4f}")
print(f"   - Macro AUC-ROC:        {auc_up:.4f}")


# ============================================================
# PASO 6: GUARDAR MODELOS E IMAGENES DE DIAGNÓSTICO
# ============================================================
print("\n--- PASO 6: Guardando modelos y graficando análisis ---")

# Guardar modelos
joblib.dump(rf_binary, os.path.join(MODELS_DIR, "rf_probability.joblib"))
joblib.dump(rf_multiclass, os.path.join(MODELS_DIR, "rf_risk.joblib"))
print("💾 Modelos Random Forest guardados en la carpeta 'models/'")

# Graficar e Importancia de variables
plt.figure(figsize=(12, 6))

# Importancia para Oxford
importances_ox = rf_binary.feature_importances_
indices_ox = np.argsort(importances_ox)[::-1]
features_ox = X_ox.columns.values  # Convert to numpy array for indexing safety

plt.subplot(1, 2, 1)
sns.barplot(
    x=importances_ox[indices_ox][:10],
    y=features_ox[indices_ox][:10],
    hue=features_ox[indices_ox][:10],
    palette="viridis",
    legend=False
)
plt.title("Top 10 Importancia (Oxford - Binario)")
plt.xlabel("Importancia")

# Importancia para UPDRS
importances_up = rf_multiclass.feature_importances_
indices_up = np.argsort(importances_up)[::-1]
features_up = X_up.columns.values  # Convert to numpy array for indexing safety

plt.subplot(1, 2, 2)
sns.barplot(
    x=importances_up[indices_up][:10],
    y=features_up[indices_up][:10],
    hue=features_up[indices_up][:10],
    palette="magma",
    legend=False
)
plt.title("Top 10 Importancia (UPDRS - Nivel de Riesgo)")
plt.xlabel("Importancia")

plt.tight_layout()
plt.savefig(os.path.join(DATA_DIR, "rf_feature_importance.png"), dpi=150)
plt.close()
print("🖼️  Gráfico de importancia de características guardado en 'outputs/rf_feature_importance.png'")

# Matrices de Confusión
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Oxford
cm_ox = confusion_matrix(y_test_ox, y_pred_ox)
sns.heatmap(cm_ox, annot=True, fmt='d', cmap='Blues', ax=axes[0],
            xticklabels=['Sano', 'Parkinson'], yticklabels=['Sano', 'Parkinson'])
axes[0].set_title("Matriz de Confusión (Oxford Binaria)")
axes[0].set_ylabel("Valor Real")
axes[0].set_xlabel("Predicción")

# UPDRS
cm_up = confusion_matrix(y_test_up, y_pred_up)
sns.heatmap(cm_up, annot=True, fmt='d', cmap='Purples', ax=axes[1],
            xticklabels=['Bajo', 'Medio', 'Alto'], yticklabels=['Bajo', 'Medio', 'Alto'])
axes[1].set_title("Matriz de Confusión (UPDRS Multiclase)")
axes[1].set_ylabel("Valor Real")
axes[1].set_xlabel("Predicción")

plt.tight_layout()
plt.savefig(os.path.join(DATA_DIR, "rf_confusion_matrices.png"), dpi=150)
plt.close()
print("🖼️  Gráficos de matrices de confusión guardados en 'outputs/rf_confusion_matrices.png'")

print("\n🎉 ¡PROCESO DE RANDOM FOREST COMPLETADO CON ÉXITO! 🎉")
print("Puedes ejecutar este script desde tu terminal PowerShell con:")
print("python train_rf.py\n")
