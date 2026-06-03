"""
=============================================================
  S-Park - API de Predicción con Inteligencia Artificial (Flask)
=============================================================
  Este microservicio carga los modelos de Random Forest
  y expone un endpoint POST /api/predict para analizar la voz.
=============================================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import joblib

app = Flask(__name__)
CORS(app)  # Permite que Angular o Express hagan peticiones cruzadas sin problemas de seguridad

# Rutas de modelos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Cargar los escaladores y modelos
print("[INFO] Cargando todos los modelos entrenados (RF, SVM, GB, XGB)...")
try:
    scaler_ox = joblib.load(os.path.join(MODELS_DIR, "scaler_oxford.joblib"))
    scaler_up = joblib.load(os.path.join(MODELS_DIR, "scaler_updrs.joblib"))
    
    # 1. Random Forest
    model_rf_binary = joblib.load(os.path.join(MODELS_DIR, "rf_probability.joblib"))
    model_rf_risk = joblib.load(os.path.join(MODELS_DIR, "rf_risk.joblib"))
    
    # 2. SVM
    model_svm_binary = joblib.load(os.path.join(MODELS_DIR, "svm_probability.joblib"))
    model_svm_risk = joblib.load(os.path.join(MODELS_DIR, "svm_risk.joblib"))
    
    # 3. Gradient Boosting
    model_gb_binary = joblib.load(os.path.join(MODELS_DIR, "gb_probability.joblib"))
    model_gb_risk = joblib.load(os.path.join(MODELS_DIR, "gb_risk.joblib"))
    
    # 4. XGBoost
    model_xgb_binary = joblib.load(os.path.join(MODELS_DIR, "xgb_probability.joblib"))
    model_xgb_risk = joblib.load(os.path.join(MODELS_DIR, "xgb_risk.joblib"))
    
    print("[SUCCESS] Todos los modelos y escaladores cargados correctamente.")
except Exception as e:
    print(f"[ERROR] Error al cargar los modelos: {e}")
    print("[WARNING] Asegurate de haber entrenado todos los modelos (train_rf.py, train_svm.py, train_gb.py, train_xgb.py).")

# Listas oficiales de columnas esperadas por los modelos
OXFORD_FEATURES = [
    'MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)', 'MDVP:Jitter(%)', 'MDVP:Jitter(Abs)',
    'MDVP:RAP', 'MDVP:PPQ', 'Jitter:DDP', 'MDVP:Shimmer', 'MDVP:Shimmer(dB)',
    'Shimmer:APQ3', 'Shimmer:APQ5', 'MDVP:APQ', 'Shimmer:DDA', 'NHR', 'HNR',
    'RPDE', 'DFA', 'spread1', 'spread2', 'D2', 'PPE'
]

UPDRS_FEATURES = [
    'Jitter(%)', 'Jitter(Abs)', 'Jitter:RAP', 'Jitter:PPQ5', 'Jitter:DDP',
    'Shimmer', 'Shimmer(dB)', 'Shimmer:APQ3', 'Shimmer:APQ5', 'Shimmer:APQ11',
    'Shimmer:DDA', 'NHR', 'HNR', 'RPDE', 'DFA', 'PPE'
]

# Mapa para normalizar nombres entrantes (por si se mandan sin prefijo MDVP:)
MAPPING_KEYS = {
    'jitter': 'MDVP:Jitter(%)',
    'jitter(%)': 'MDVP:Jitter(%)',
    'jitter_abs': 'MDVP:Jitter(Abs)',
    'jitter(abs)': 'MDVP:Jitter(Abs)',
    'jitter:rap': 'MDVP:RAP',
    'jitter_rap': 'MDVP:RAP',
    'rap': 'MDVP:RAP',
    'mdvp_rap': 'MDVP:RAP',
    'jitter:ppq5': 'Jitter:PPQ5',
    'jitter_ppq5': 'Jitter:PPQ5',
    'ppq5': 'Jitter:PPQ5',
    'mdvp_ppq': 'MDVP:PPQ',
    'ppq': 'MDVP:PPQ',
    'jitter:ddp': 'Jitter:DDP',
    'jitter_ddp': 'Jitter:DDP',
    'ddp': 'Jitter:DDP',
    'shimmer': 'MDVP:Shimmer',
    'shimmer(db)': 'MDVP:Shimmer(dB)',
    'shimmer_db': 'MDVP:Shimmer(dB)',
    'shimmer:apq3': 'Shimmer:APQ3',
    'shimmer_apq3': 'Shimmer:APQ3',
    'apq3': 'Shimmer:APQ3',
    'shimmer:apq5': 'Shimmer:APQ5',
    'shimmer_apq5': 'Shimmer:APQ5',
    'apq5': 'Shimmer:APQ5',
    'shimmer:apq11': 'Shimmer:APQ11',
    'shimmer_apq11': 'Shimmer:APQ11',
    'apq11': 'Shimmer:APQ11',
    'mdvp_apq': 'MDVP:APQ',
    'apq': 'MDVP:APQ',
    'shimmer:dda': 'Shimmer:DDA',
    'shimmer_dda': 'Shimmer:DDA',
    'dda': 'Shimmer:DDA',
    'nhr': 'NHR',
    'hnr': 'HNR',
    'rpde': 'RPDE',
    'dfa': 'DFA',
    'spread1': 'spread1',
    'spread2': 'spread2',
    'd2': 'D2',
    'ppe': 'PPE',
    'mdvp_fo': 'MDVP:Fo(Hz)',
    'mdvp_fo_hz': 'MDVP:Fo(Hz)',
    'mdvp_fhi': 'MDVP:Fhi(Hz)',
    'mdvp_fhi_hz': 'MDVP:Fhi(Hz)',
    'mdvp_flo': 'MDVP:Flo(Hz)',
    'mdvp_flo_hz': 'MDVP:Flo(Hz)',
}

def parse_input_data(data_json):
    """Normaliza y mapea el JSON de entrada a los nombres exactos de los dos datasets."""
    normalized = {}
    
    # 1. Pasar todas las llaves a minúsculas para evitar problemas de mayúsculas/minúsculas
    input_lower = {k.lower(): v for k, v in data_json.items()}
    
    # 2. Mapear usando nuestro diccionario de traducción
    for input_key, value in input_lower.items():
        if input_key in MAPPING_KEYS:
            target_key = MAPPING_KEYS[input_key]
            normalized[target_key] = float(value)
        else:
            # Si ya venía con el nombre exacto de columna, guardarlo
            normalized[input_key] = float(value)
            
    # Autorellenar Jitter:PPQ5 y Shimmer:APQ11 para UPDRS si solo viene el homólogo de Oxford
    if 'MDVP:PPQ' in normalized and 'Jitter:PPQ5' not in normalized:
        normalized['Jitter:PPQ5'] = normalized['MDVP:PPQ']
    if 'MDVP:APQ' in normalized and 'Shimmer:APQ11' not in normalized:
        normalized['Shimmer:APQ11'] = normalized['MDVP:APQ']
        
    return normalized

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Normalizar y procesar los parámetros recibidos
        normalized_data = parse_input_data(data)
        
        # ============================================================
        # PREDICCIÓN 1: PROBABILIDAD DE PARKINSON (Oxford Model)
        # ============================================================
        # Extraer los 22 features ordenados para Oxford
        ox_vector = []
        for feature in OXFORD_FEATURES:
            # Si falta un feature, le ponemos el valor medio por defecto
            val = normalized_data.get(feature, 0.0)
            ox_vector.append(val)
            
        # Crear DataFrame para el escalador
        df_ox = pd.DataFrame([ox_vector], columns=OXFORD_FEATURES)
        ox_scaled = scaler_ox.transform(df_ox)
        
        # Predecir probabilidades con todos los modelos binarios (RF, SVM, GB, XGB)
        prob_rf = float(model_rf_binary.predict_proba(ox_scaled)[0][1] * 100)
        prob_svm = float(model_svm_binary.predict_proba(ox_scaled)[0][1] * 100)
        prob_gb = float(model_gb_binary.predict_proba(ox_scaled)[0][1] * 100)
        prob_xgb = float(model_xgb_binary.predict_proba(ox_scaled)[0][1] * 100)
        
        # La probabilidad principal de Parkinson es el promedio de los 4 modelos (Ensemble)
        prob_parkinson = float((prob_rf + prob_svm + prob_gb + prob_xgb) / 4)
        
        # ============================================================
        # PREDICCIÓN 2: NIVEL DE RIESGO (UPDRS Model)
        # ============================================================
        # Extraer los 16 features ordenados para UPDRS
        up_vector = []
        for feature in UPDRS_FEATURES:
            val = normalized_data.get(feature, 0.0)
            up_vector.append(val)
            
        df_up = pd.DataFrame([up_vector], columns=UPDRS_FEATURES)
        up_scaled = scaler_up.transform(df_up)
        
        # Predecir nivel de riesgo con todos los modelos multiclase
        prob_risk_rf = model_rf_risk.predict_proba(up_scaled)[0]
        prob_risk_svm = model_svm_risk.predict_proba(up_scaled)[0]
        prob_risk_gb = model_gb_risk.predict_proba(up_scaled)[0]
        prob_risk_xgb = model_xgb_risk.predict_proba(up_scaled)[0]
        
        # Promedio de probabilidades de los 4 modelos (Voto suave / Soft Voting)
        prob_risk_avg = (prob_risk_rf + prob_risk_svm + prob_risk_gb + prob_risk_xgb) / 4
        max_idx = np.argmax(prob_risk_avg)
        
        risk_labels = ['BAJO', 'MEDIO', 'ALTO']
        risk_level = risk_labels[max_idx]
        
        # ============================================================
        # CONSTRUCCIÓN DE LA INTERPRETACIÓN CLÍNICA
        # ============================================================
        if prob_parkinson < 30:
            interpretation = (
                f"El análisis acústico indica estabilidad en las frecuencias vocales "
                f"con una probabilidad muy baja de indicadores compatibles ({prob_parkinson:.1f}%). "
                f"El nivel de riesgo se clasifica como {risk_level}."
            )
        elif prob_parkinson < 70:
            interpretation = (
                f"Se detectan fluctuaciones leves en los armónicos y jitter. La probabilidad de "
                f"indicadores compatibles es moderada ({prob_parkinson:.1f}%). Se sugiere seguimiento "
                f"médico periódico. Nivel de riesgo estimado: {risk_level}."
            )
        else:
            interpretation = (
                f"ATENCIÓN: Se identifican alteraciones acústicas significativas (shimmer y jitter elevados, HNR disminuido) "
                f"altamente compatibles con disfonía parkinsoniana (probabilidad de {prob_parkinson:.1f}%). "
                f"Nivel de riesgo clínico estimado como {risk_level}. Se recomienda priorización diagnóstica."
            )

        # Retornar respuesta estructurada con datos reales de todos los modelos
        response = {
            "probabilidad": round(prob_parkinson, 2),
            "riesgo": risk_level,
            "interpretacion": interpretation,
            "comparacion_modelos": {
                "Random Forest": round(prob_rf, 2),
                "SVM": round(prob_svm, 2),
                "Gradient Boosting": round(prob_gb, 2),
                "XGBoost": round(prob_xgb, 2)
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ejecutar en puerto 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
