import os
from pathlib import Path
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "crop_yield_decision_tree_pipeline.joblib"
DATA_PATH = BASE_DIR / "data" / "AgricultureRainfall_1998-2017.csv"

# Load trained pipeline
print(f"Loading model pipeline from: {MODEL_PATH}...")
pipeline = joblib.load(MODEL_PATH)

# Load unique dropdown choices from dataset
df = pd.read_csv(DATA_PATH)
STATES = sorted(df["State"].dropna().unique().tolist())
CROPS = sorted(df["Crop"].dropna().unique().tolist())


@app.route("/")
def index():
    """Render the primary HTML user interface."""
    return render_template("index.html", states=STATES, crops=CROPS)


@app.route("/predict", methods=["POST"])
def predict():
    """API endpoint for prediction handling both JSON and form data."""
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        # Extract features
        state = str(data.get("state", "")).strip().lower()
        crop = str(data.get("crop", "")).strip()
        year = int(data.get("year", 2026))
        area = float(data.get("area", 0.0))
        annual = float(data.get("annual", 0.0))
        monsoon = float(data.get("monsoon", 0.0))
        prev_yield = float(data.get("prev_yield", 0.0))

        # Build single-row DataFrame matching the exact pipeline feature schema
        input_df = pd.DataFrame([{
            "State": state,
            "Crop": crop,
            "Year": year,
            "Area": area,
            "Annual": annual,
            "Monsoon": monsoon,
            "PrevYearYield": prev_yield
        }])

        # Predict outcome and class probabilities
        prediction = int(pipeline.predict(input_df)[0])
        probabilities = pipeline.predict_proba(input_df)[0]
        prob_unfavorable = float(probabilities[0])
        prob_favorable = float(probabilities[1])

        confidence = prob_favorable if prediction == 1 else prob_unfavorable
        confidence_percent = round(confidence * 100, 1)

        result = {
            "success": True,
            "prediction": prediction,
            "label": "Favorable Yield" if prediction == 1 else "Unfavorable Yield",
            "status": "favorable" if prediction == 1 else "unfavorable",
            "confidence": confidence_percent,
            "prob_favorable": round(prob_favorable * 100, 1),
            "prob_unfavorable": round(prob_unfavorable * 100, 1),
            "summary": (
                "Based on the rainfall levels and historical yield trends, the model predicts that crop yield "
                "is expected to meet or exceed benchmark standards."
                if prediction == 1
                else
                "Based on rainfall indicators and historical yield records, the model predicts that crop yield "
                "is likely to fall below benchmark standards. Precautionary agricultural planning is advised."
            )
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


if __name__ == "__main__":
    # Run the server locally on port 5000
    print("Starting Indian Agriculture Crop Yield Prediction Web App...")
    app.run(host="127.0.0.1", port=5000, debug=True)
