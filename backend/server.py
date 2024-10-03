import firebase_admin
from firebase_admin import credentials
from flask import Flask

app = Flask(__name__)
@app.route('/')
def hello_world():
    return '<p>Hello, World!</p>'

a = firebase_admin.initialize_app(credentials.Certificate({
        'apiKey': 'AIzaSyD4WlWqGQ2vpr5avhOi5RigRvCBfetbisg',
        'authDomain': 'learn-firebase-6b3b4.firebaseapp.com',
        'projectId': 'learn-firebase-6b3b4',
        'storageBucket': 'learn-firebase-6b3b4.appspot.com',
        'messagingSenderId': '176093873193',
        'appId': '1:176093873193:web:2377cc57c19559d62e4838',
        'measurementId': 'G-39QLEL08ER',
    }))
print(a)