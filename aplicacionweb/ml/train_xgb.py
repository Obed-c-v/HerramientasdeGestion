"""
=============================================================
  S-Park - Entrenamiento y Evaluacion: XGBoost
=============================================================
  Este script entrena dos modelos de XGBoost (Extreme Gradient Boosting):
  1. Clasificador Binario (Oxford): Detectar Parkinson (Sano vs Enfermo)
  2. Clasificador Multiclase (UPDRS): Nivel de Riesgo (Bajo, Medio, Alto)
=============================================================
"""

import pandas as pd
import numpy as np
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
# pyrefly: ignore [missing-import]
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    log_loss,
    roc_auc_score
)

# Definicion de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "outputs")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("  ENTRENANDO MODELOS XGBOOST...")
print("=" * 60)

# PASO 1: CARGA DE LOS DATASETS LIMPIOS
print("\n--- PASO 1: Cargando datasets limpios ---")
df_oxford = pd.read_csv(os.path.join(DATA_DIR, "oxford_clean.csv"))
df_updrs = pd.read_csv(os.path.join(DATA_DIR, "updrs_clean.csv"))

# PASO 2: SEPARACION DE VARIABLES Y PARTICION TRAIN/TEST
print("\n--- PASO 2: Division Train/Test ---")
# Oxford (Binario)
X_ox = df_oxford.drop(columns=['status'])
y_ox = df_oxford['status']
X_train_ox, X_test_ox, y_train_ox, y_test_ox = train_test_split(
    X_ox, y_ox, test_size=0.2, random_state=42, stratify=y_ox
)

# UPDRS (Multiclase)
X_up = df_updrs.drop(columns=['nivel_riesgo'])
y_up = df_updrs['nivel_riesgo']
class_mapping = {'BAJO': 0, 'MEDIO': 1, 'ALTO': 2}
y_up_encoded = y_up.map(class_mapping)

X_train_up, X_test_up, y_train_up, y_test_up = train_test_split(
    X_up, y_up_encoded, test_size=0.2, random_state=42, stratify=y_up_encoded
)

# PASO 3: ESCALAMIENTO
print("\n--- PASO 3: Normalización de datos ---")
scaler_ox = joblib.load(os.path.join(MODELS_DIR, "scaler_oxford.joblib"))
scaler_up = joblib.load(os.path.join(MODELS_DIR, "scaler_updrs.joblib"))

X_train_ox_scaled = scaler_ox.transform(X_train_ox)
X_test_ox_scaled = scaler_ox.transform(X_test_ox)
X_train_up_scaled = scaler_up.transform(X_train_up)
X_test_up_scaled = scaler_up.transform(X_test_up)

# PASO 4: MODELO 1 - XGBOOST BINARIO
print("\n" + "=" * 60)
print("  ENTRENANDO MODELO 1: XGBOOST BINARIO (Oxford)")
print("=" * 60)

# XGBClassifier tiene soporte directo de GPU e implementaciones muy veloces y optimizadas de Gradient Boosting.
xgb_binary = XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    eval_metric='logloss',
    random_state=42
)

xgb_binary.fit(X_train_ox_scaled, y_train_ox)
y_pred_ox = xgb_binary.predict(X_test_ox_scaled)
y_prob_ox = xgb_binary.predict_proba(X_test_ox_scaled)[:, 1]

# Métricas
acc_ox = accuracy_score(y_test_ox, y_pred_ox)
prec_ox = precision_score(y_test_ox, y_pred_ox)
rec_ox = recall_score(y_test_ox, y_pred_ox)
f1_ox = f1_score(y_test_ox, y_pred_ox)
loss_ox = log_loss(y_test_ox, y_prob_ox)
auc_ox = roc_auc_score(y_test_ox, y_prob_ox)

print("\nMETRICAS XGB BINARIO (TEST):")
print(f"   - Exactitud (Accuracy): {acc_ox:.4f}")
print(f"   - Precision:            {prec_ox:.4f}")
print(f"   - Sensibilidad (Recall):{rec_ox:.4f}")
print(f"   - F1-Score:             {f1_ox:.4f}")
print(f"   - Log Loss:             {loss_ox:.4f}")
print(f"   - AUC-ROC:              {auc_ox:.4f}")

# PASO 5: MODELO 2 - XGBOOST MULTICLASE
print("\n" + "=" * 60)
print("  ENTRENANDO MODELO 2: XGBOOST MULTICLASE (UPDRS)")
print("=" * 60)

xgb_multiclass = XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    eval_metric='mlogloss',
    random_state=42
)

print("Entrenando XGBoost Multiclase...")
xgb_multiclass.fit(X_train_up_scaled, y_train_up)
y_pred_up = xgb_multiclass.predict(X_test_up_scaled)
y_prob_up = xgb_multiclass.predict_proba(X_test_up_scaled)

# Métricas
acc_up = accuracy_score(y_test_up, y_pred_up)
prec_up = precision_score(y_test_up, y_pred_up, average='macro')
rec_up = recall_score(y_test_up, y_pred_up, average='macro')
f1_up = f1_score(y_test_up, y_pred_up, average='macro')
loss_up = log_loss(y_test_up, y_prob_up)
auc_up = roc_auc_score(y_test_up, y_prob_up, multi_class='ovr', average='macro')

print("\nMETRICAS XGB MULTICLASE (TEST):")
print(f"   - Exactitud (Accuracy): {acc_up:.4f}")
print(f"   - Macro Precision:      {prec_up:.4f}")
print(f"   - Macro Sensibilidad:   {rec_up:.4f}")
print(f"   - Macro F1-Score:       {f1_up:.4f}")
print(f"   - Log Loss:             {loss_up:.4f}")
print(f"   - Macro AUC-ROC:        {auc_up:.4f}")

# PASO 6: GUARDAR MODELOS Y MATRICES DE CONFUSION
print("\n--- PASO 6: Guardando modelos y matrices de confusion ---")
joblib.dump(xgb_binary, os.path.join(MODELS_DIR, "xgb_probability.joblib"))
joblib.dump(xgb_multiclass, os.path.join(MODELS_DIR, "xgb_risk.joblib"))
print("Modelos XGBoost guardados en la carpeta 'models/'")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Oxford
cm_ox = confusion_matrix(y_test_ox, y_pred_ox)
sns.heatmap(cm_ox, annot=True, fmt='d', cmap='Oranges', ax=axes[0],
            xticklabels=['Sano', 'Parkinson'], yticklabels=['Sano', 'Parkinson'])
axes[0].set_title("XGB - Confusion Matrix (Oxford Binaria)")
axes[0].set_ylabel("Valor Real")
axes[0].set_xlabel("Prediccion")

# UPDRS
cm_up = confusion_matrix(y_test_up, y_pred_up)
sns.heatmap(cm_up, annot=True, fmt='d', cmap='Reds', ax=axes[1],
            xticklabels=['Bajo', 'Medio', 'Alto'], yticklabels=['Bajo', 'Medio', 'Alto'])
axes[1].set_title("XGB - Confusion Matrix (UPDRS Multiclase)")
axes[1].set_ylabel("Valor Real")
axes[1].set_xlabel("Prediccion")

plt.tight_layout()
plt.savefig(os.path.join(DATA_DIR, "xgb_confusion_matrices.png"), dpi=150)
plt.close()
print("Matrices de confusión guardadas en 'outputs/xgb_confusion_matrices.png'")
print("\n===================================================")
print("  PROCESO DE XGBOOST COMPLETADO CON EXITO!")
print("===================================================")
