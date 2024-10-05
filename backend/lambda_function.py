import firebase_admin
from firebase_admin import firestore
from firebase_admin.credentials import Certificate

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        Certificate('firebase.json'))
db = firestore.client()

from flask import Flask
app = Flask(__name__)
@app.route('/test')
def test_firestore():
    from datetime import datetime
    _, doc = db.collection('testing').add({
        'name': 'tester',
        'time': datetime.now()
    })
    assert doc.get().to_dict()['name'] == 'tester'
    doc.delete()
    assert doc.get().to_dict() == None
    return 'Tested successfully'
