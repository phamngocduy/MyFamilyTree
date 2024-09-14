async function loadFirebase() {
    const {initializeApp} = await importFirebase('app');
    const {getAuth, onAuthStateChanged, signOut} = await importFirebase('auth');
    const {getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, query, where, writeBatch, deleteDoc} = await importFirebase('firestore');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.user = user;
            dispatchEvent(new CustomEvent(USER));
            window.signOut = () => invoke(signOut(auth));
        }
        else window.location = LOGIN_HTML;
    });

    const db = getFirestore(app);
    db.newDoc = async function(group) {
        return await doc(collection(db, group));
    }
    db.refDoc = async function(group, id) {
        return await doc(collection(db, group), id);
    }
    db.addDoc = async function(group, json) {
        return await addDoc(collection(db, group), json);
    }
    db.setDoc = async function(group, id, json) {
        return await setDoc(doc(db, group, id), json);
    }
    db.getDoc = async function(group, id) {
        return !id? await getDoc(group):
            await getDoc(doc(db, group, id));
    }
    db.getDocs = async function(group, field, operator, value) {
        return await getDocs(query(collection(db, group), where(field, operator, value)));
    }
    db.batch = async function() {
        return await writeBatch(db);
    }
    db.delDoc = async function(group, id) {
        return await deleteDoc(doc(db, group, id));
    }
    window.db = db;
}

addEventListener(LOAD, () =>
    invoke(loadFirebase(), () =>
        dispatchEvent(new CustomEvent(INIT)))
);

async function getMember(id) {
    return await db.getDoc(MEMBERS, id);
}
async function getMembers(uid) {
    return await db.getDocs(MEMBERS, 'userid', ARRAY_CONTAINS, uid);
}
async function addMember(member) {
    return await db.addDoc(MEMBERS, member);
}
async function setMember(id, member) {
    return await db.setDoc(MEMBERS, id, member);
}
async function delMember(id) {
    return await db.delDoc(MEMBERS, id);
}

async function loadMember(id) {
    const member = await getMember(id);
    return member.exists() ? member.data() : undefined;
}

async function initMember() {
    const Q = 'q';
    const id = new URL(location).searchParams.get(Q);
    if (id != undefined) {
        const member = await loadMember(id);
        if (member != undefined)
            return {
                id: id,
                details: member
            };
        else location.replace('.');
    } else {
        const members = await getMembers(user.uid);
        if (members.size > 0) {
            location.replace(`?${Q}=${members.docs[0].id}`);
        } else {
            const member = await addMember({
                userid: [user.uid],
                email: user.email,
                phone: user.phoneNumber,
                fullname: user[displayName] ?? 'Anonymous'
            });
            location.replace(`?${Q}=${member.id}`);
        }
    }
}

async function saveMember(id, member) {
    await setMember(id, member);
    return await loadMember(id);
}


async function getRelation(id) {
    return await db.getDoc(RELATIONS, id);
}
async function setRelation(id, relation) {
    return await db.setDoc(RELATIONS, id, relation);
}
async function getParents(member_id) {
    return await db.getDocs(RELATIONS, 'children', ARRAY_CONTAINS, member_id);
}
async function getRelations(member_id) {
    return await db.getDocs(RELATIONS, 'parents', ARRAY_CONTAINS, member_id);
}

function initFamilies(member_id, family_id) {
    return [{
        id: family_id,
        holder_id: member_id,
        children: []
    }]
}

async function loadFamily(member_id) {
    const families = [];
    const relations = await getRelations(member_id);
    for (const docRef of relations.docs) {
        const family = initFamilies(member_id, docRef.id)[0];
        const relation = docRef.data();
        relation.parents.remove(member_id);
        if (relation.parents.length > 0) {
            const spouse = await loadMember(relation.parents[0]);
            family.spouse = {
                id: relation.parents[0],
                details: spouse
            }
        }
        for (const child_id of relation.children) {
            const child = await loadMember(child_id);
            family.children.push({
                id: child_id,
                details: child,
                families: await loadFamily(child_id)
            });
        }
        families.push(family);
    }
    return families.length ? families : initFamilies(member_id);
}

async function saveRelation(relation_id, holder_id, member) {
    const batch = await db.batch();
    if (relation_id == undefined) {
        const relationRef = await db.newDoc('relations');
        await batch.set(relationRef, {
            parents: [holder_id],
            children: []
        });
        relation_id = relationRef.id;
    }
    const relationRef = await db.refDoc('relations', relation_id);
    const memberRef = await db.newDoc('members');
    await batch.set(memberRef, member);
    const relation = await db.getDoc(relationRef);
    return [batch, relationRef, memberRef, relation.data()];
}

async function saveSpouse(family, spouse) {
    const [batch, relationRef, spouseRef, relation] =
        await saveRelation(family.id, family.holder_id, spouse);
    relation.parents.push(spouseRef.id);
    await batch.set(relationRef, relation);
    await batch.commit();
    family.id = relationRef.id;
    return {
        id: spouseRef.id,
        details: await loadMember(spouseRef.id)
    };
}

async function saveChild(family, child) {
    const [batch, relationRef, childRef, relation] =
        await saveRelation(family.id, family.holder_id, child);
    relation.children.push(childRef.id);
    await batch.set(relationRef, relation);
    await batch.commit();
    family.id = relationRef.id;
    return {
        id: childRef.id,
        details: await loadMember(childRef.id),
        families: initFamilies(childRef.id)
    }
}

async function dropChild(family, child) {
    const batch = await db.batch();
    const relations = await getRelations(child.id);
    if (relations.size > 0) return false;
    const relation = await getRelation(family.id);
    relation.children.remove(child.id);
    await setRelation(family.id, relation);
    await delMember(child.id);
    return true;
}