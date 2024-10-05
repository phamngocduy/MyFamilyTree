from flask import Flask, request, jsonify
from flask_cors import CORS
from firestore import testFirestore
from business import handleRequest

app = Flask(__name__)
CORS(app)

@app.route('/')
def test_firestore():
    return testFirestore()

@app.route('/', methods=['POST'])
def flask_handler():
    json = handleRequest(request.json)
    return jsonify(json), 200
