import os
import firebase_admin
from firebase_admin import auth, firestore
from firebase_admin.credentials import Certificate
from firebase_admin.firestore import FieldFilter, Or

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        Certificate(os.getenv('firebase_json')
                    or 'firebase.json'))
db = firestore.client()

def testFirestore():
    from datetime import datetime
    _, doc = db.collection('testing').add({
        'name': 'tester',
        'time': datetime.now()
    })
    assert doc.get().to_dict()['name'] == 'tester'
    doc.delete()
    assert doc.get().to_dict() == None
    return 'Firestore tested successful'

ID = 'id'
USERID = 'userid'
SPOUSE = 'spouse'
COUNTER = 'counter'
MEMBERS = 'members'
DETAILS = 'details'
PARENTS = 'parents'
CHILDREN = 'children'
FAMILIES = 'families'
RELATIONS = 'relations'
ARRAY_CONTAINS = 'array_contains'

class Collection:
    def __init__(self, name, db=db):
        self.name = name
        self.db = db
    def __call__(self):
        return self.db.collection(self.name)
    def __getitem__(self, key):
        return self().document(key)
    def get(self, key):
        return self[key].get()
    def load(self, key):
        return self.get(key).to_dict()
    def add(self, data=None):
        return self().add(data)[1] if data else self().document()
    def set(self, key, data):
        return self[key].set(data)
    def query(self, filter):
        return self().where(filter=filter)

class Member(Collection):
    def __init__(self, name=MEMBERS):
        super().__init__(name)
    def query(self, user_id):
        return super().query(FieldFilter(USERID, ARRAY_CONTAINS, user_id))

class Relation(Collection):
    def __init__(self, name=RELATIONS):
        super().__init__(name)
    def query(self, array, item):
        return super().query(FieldFilter(array, ARRAY_CONTAINS, item))
    def byParents(self, key):
        return self.query(PARENTS, key)
    def byChildren(self, key):
        return self.query(CHILDREN, key)
    def byRelations(self, key):
        return super().query(Or([
            FieldFilter(PARENTS, ARRAY_CONTAINS, key),
            FieldFilter(CHILDREN, ARRAY_CONTAINS, key)
        ]))
