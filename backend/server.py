from flask import Flask, request
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
    return handleRequest(request.json)

import json
def lambda_handler(event, context):
    if 'body' in event:
        event = json.loads(event['body'])

    response = ''
    if 'action' in event:
        response = handleRequest(event)
    elif event['requestContext']['http']['method'].upper() == 'GET':
        response = testFirestore()

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': response
    }
