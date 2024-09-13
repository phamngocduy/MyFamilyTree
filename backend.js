async function loadFirebase() {
    const {initializeApp} = await importFirebase('app');
    const {getAuth, onAuthStateChanged, signOut} = await importFirebase('auth');
    const {getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, query, where, writeBatch} = await importFirebase('firestore');

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
    window.db = db;
}

addEventListener(LOAD, () =>
    invoke(loadFirebase(), () =>
        dispatchEvent(new CustomEvent(INIT)))
);

async function loadMember(member_id) {
    const member = await db.getDoc('members', member_id);
    return member.exists() ? member.data() : undefined;
}

async function initMember() {
    const member_id = new URL(location).searchParams.get(Q);
    if (member_id != undefined) {
        const member = await loadMember(member_id);
        if (member != undefined)
            return {
                id: member_id,
                details: member
            }
        else location.replace('.');
    } else {
        const members = await db.getDocs('members', 'userid', 'array-contains', user.uid);
        if (members.size > 0) {
            location.replace(`?${Q}=${members.docs[0].id}`);
        } else {
            const member = await db.addDoc('members', {
                userid: [user.uid],
                email: user.email,
                phone: user.phoneNumber,
                fullname: user.displayName ?? 'Anonymous'
            });
            location.replace(`?${Q}=${member.id}`);
        }
    }
}

async function saveMember(id, member) {
    await db.setDoc('members', id, member);
    return await loadMember(id);
}

async function loadFamily(member_id) {
    const relations = await db.getDocs('relations', 'parents', 'array-contains', member_id);
    const family = {member_id: member_id, children: []};
    if (relations.size > 0) {
        family.id = relations.docs[0].id;
        const relation = relations.docs[0].data();
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
                details: child
            });
        }
    };
    return family;
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
        await saveRelation(family.id, family.member_id, spouse);
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
        await saveRelation(family.id, family.member_id, child);
    relation.children.push(childRef.id);
    await batch.set(relationRef, relation);
    await batch.commit();
    family.id = relationRef.id;
    return {
        id: childRef.id,
        details: await loadMember(childRef.id)
    }
}
