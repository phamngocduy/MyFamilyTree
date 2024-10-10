from firestore import *

Members = Member()
Relations = Relation()

ACTION = 'action'
CONTENT = 'content'

def handleRequest(json):
    action = json[ACTION]
    content = json[CONTENT]
    if action in globals().keys():
        return globals()[action](**content)
    else: return json

def initMember(query, user):
    if query:
        member = Members.get(query)
        if member.exists:
            return {
                ID: member.id,
                DETAILS: member.to_dict()
            }
    members = Members.query(user)
    for member in members.stream():
        return {
            ID: member.id,
            DETAILS: member.to_dict()
        }
    user = auth.get_user(user)
    member = Members.add({
        "userid": [user.uid],
        "email": user.email,
        "phone": user.phone_number,
        "fullname": user.display_name or 'Anonymous'
    })
    return {ID: member.id}

def saveMember(id, member):
    Members.set(id, member)
    return {}

def loadFamily(member_id, recursive=True):
    families = [];
    relations = Relations.byParents(member_id)
    for relation in relations.stream():
        family =  {
            ID: relation.id,
            CHILDREN: []
        }
        relation = relation.to_dict()
        relation[PARENTS].remove(member_id)
        if len(relation[PARENTS]):
            spouse = Members.get(relation[PARENTS][0])
            if spouse.exists:
                family[SPOUSE] = {
                    ID: relation[PARENTS][0],
                    DETAILS: spouse.to_dict()
                }
        if recursive:
            for child_id in relation[CHILDREN]:
                child = Members.get(child_id)
                if child.exists:
                    family[CHILDREN].append({
                        ID: child_id,
                        DETAILS: child.to_dict(),
                        FAMILIES: loadFamily(child_id, False)
                    })
        else: family[COUNTER] = len(relation[CHILDREN])
        families.append(family)
    return families

def loadMember(member_id):
    member = Members.get(member_id)
    if member.exists:
        return {
            ID: member.id,
            DETAILS: member.to_dict(),
            FAMILIES: loadFamily(member_id, False)
        }
    else: return {}

def loadParents(member_id):
    parents = []
    children = []
    family_id = None
    relations = Relations.byChildren(member_id)
    for relation in relations.stream():
        family_id = relation.id
        relation = relation.to_dict()
        for parent_id in relation[PARENTS]:
            parent = Members.get(parent_id)
            if parent.exists:
                parents.append({
                    ID: parent_id,
                    DETAILS: parent.to_dict()
                })
        children.extend(relation[CHILDREN])
    return {
        ID: family_id,
        PARENTS: parents,
        CHILDREN: children
    }

def initRelation(relation_id, member_id, as_holder=True):
    relation = Relations.load(relation_id) if relation_id else {
        PARENTS: [member_id],
        CHILDREN: []
    } if as_holder else {
        PARENTS: [],
        CHILDREN: [member_id]
    }
    return relation_id or Relations.add().id, relation, Members.add().id

def saveChild(family_id, parent_id, child):
    relation_id, relation, child_id = initRelation(family_id, parent_id)
    relation[CHILDREN].append(child_id)

    batch = db.batch()
    batch.set(Relations[relation_id], relation)
    batch.set(Members[child_id], child)
    batch.commit()
    return [relation_id, child_id]

def saveSpouse(family_id, holder_id, spouse):
    relation_id, relation, spouse_id = initRelation(family_id, holder_id)
    relation[PARENTS].append(spouse_id)

    batch = db.batch()
    batch.set(Relations[relation_id], relation)
    batch.set(Members[spouse_id], spouse)
    batch.commit()
    return [relation_id, spouse_id]

def saveParent(family_id, child_id, parent):
    relation_id, relation, parent_id = initRelation(family_id, child_id, False)
    relation[PARENTS].append(parent_id)

    batch = db.batch()
    batch.set(Relations[relation_id], relation)
    batch.set(Members[parent_id], parent)
    batch.commit()
    return [relation_id, parent_id]

def editRelation(batch, relation_id, relation):
    if len(relation[PARENTS]) == 1 and len(relation[CHILDREN]) == 0:
        batch.delete(Relations[relation_id])
    else: batch.set(Relations[relation_id], relation)

def dropChild(family_id, child_id):
    relations = Relations.byRelations(child_id)
    if len(relations.get()) > 1: return [False]

    relation = Relations.load(family_id)
    relation[CHILDREN].remove(child_id)

    batch = db.batch()
    editRelation(batch, family_id, relation)
    batch.delete(Members[child_id])
    batch.commit()
    return [True]

def dropHolder(family_id, holder_id):
    relation = Relations.load(family_id)
    relation[PARENTS].remove(holder_id)
    if len(relation[PARENTS]) == 0 and len(relation[CHILDREN]) > 0:
        return [False]

    batch = db.batch()
    editRelation(batch, family_id, relation)
    if len(Relations.byRelations(holder_id).get()) == 1:
        batch.delete(Members[holder_id])
    batch.commit()
    return [True]
