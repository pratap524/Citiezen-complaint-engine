from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import random
import torch
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Ensure tensors are initialized with float32
torch.set_default_dtype(torch.float32)

# Custom model class to override weight initialization
class CustomModel(AutoModelForSequenceClassification):
    def _init_weights(self, module):
        if hasattr(module, 'weight') and module.weight is not None:
            module.weight.data = module.weight.data.float()
        if hasattr(module, 'bias') and module.bias is not None:
            module.bias.data = module.bias.data.float()

# Load the model with explicit data type handling
try:
    model = CustomModel.from_pretrained(
        "./local_library",
        dtype=torch.float32  # Use `dtype` instead of `torch_dtype`
    )

    # Load the zero-shot classification pipeline with a pretrained model
    try:
        classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",  # Use pretrained model from Hugging Face hub
            device=-1  # Use CPU
        )
        print("Model loaded successfully.")
    except Exception as e:
        print("Error loading model:", e)
        raise

except Exception as e:
    print("Error loading model:", e)
    raise

# Define the candidate labels (departments)
departments = ["Sanitation", "Roads", "Water", "Electricity", "Animal Control"]

@app.route("/api/classify", methods=["POST"])
def classify_complaint():
    try:
        # Extract the complaint text from the request
        data = request.get_json()
        complaint_text = data.get("complaint", "")

        if not complaint_text:
            return jsonify({"error": "Complaint field is required."}), 400

        # Perform zero-shot classification
        result = classifier(complaint_text, departments)

        # Return the classification result
        return jsonify({"labels": result["labels"], "scores": result["scores"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("AI_PORT", "5001")), debug=True)