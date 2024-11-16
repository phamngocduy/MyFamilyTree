import functions_framework, json
from firestore import testFirestore
from business import handleRequest

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
}

@functions_framework.http
def flask_handler(request):
    if request.method == 'OPTIONS':
        return ('', 204, CORS)
    if request.method == 'GET':
        return testFirestore()
    json = request.get_json(silent=True)
    return (handleRequest(json), 200, CORS)

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
        'headers': CORS,
        'body': response
    }
