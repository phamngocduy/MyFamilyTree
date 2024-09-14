addEventListener(LOAD, () =>
    invoke(initBackend(), (backend) => {
        window.api = backend;
        dispatchEvent(new CustomEvent(INIT));
    })
);

async function initBackend() {
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
        return db;
    }
    const db = await loadFirebase();

    async function refMember(id) {
        return await db.refDoc(MEMBERS, id);
    }
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
    async function newMember() {
        return await db.newDoc(MEMBERS);
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
    
    async function refRelation(id) {
        return await db.refDoc(RELATIONS, id);
    }
    async function getRelation(id) {
        return await db.getDoc(RELATIONS, id);
    }
    async function getParents(member_id) {
        return await db.getDocs(RELATIONS, 'children', ARRAY_CONTAINS, member_id);
    }
    async function getRelations(member_id) {
        return await db.getDocs(RELATIONS, 'parents', ARRAY_CONTAINS, member_id);
    }
    async function newRelation() {
        return await db.newDoc(RELATIONS);
    }

    async function loadRelation(id) {
        const relation = await getRelation(id);
        return relation.exists() ? relation.data() : undefined;
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
    
    async function initRelation(relation_id, holder_id) {
        const relation = relation_id ? await loadRelation(relation_id) : {
            parents: [holder_id],
            children: []
        }
        relation_id = relation_id ?? (await newRelation()).id;
        const member_id = (await newMember()).id;
        return [relation_id, member_id, relation];
    }
    
    async function saveSpouse(family_id, holder_id, spouse) {
        const [relation_id, member_id, relation] =
            await initRelation(family_id, holder_id);
        relation.parents.push(member_id);

        const batch = await db.batch();
        await batch.set(await refRelation(relation_id), relation);
        await batch.set(await refMember(member_id), spouse);
        await batch.commit();
        return [{
            id: member_id,
            details: await loadMember(member_id)
        }, relation_id];
    }
    
    async function saveChild(family_id, holder_id, child) {
        const [relation_id, member_id, relation] =
            await initRelation(family_id, holder_id);
        relation.children.push(member_id);
        
        const batch = await db.batch();
        await batch.set(await refRelation(relation_id), relation);
        await batch.set(await refMember(member_id), child);
        await batch.commit();
        return [{
            id: member_id,
            details: await loadMember(member_id),
            families: initFamilies(member_id)
        }, relation_id];
    }

    async function editRelation(batch, relation_id, relation) {
        if (relation.parents.length == 1 && relation.children.length == 0)
            await batch.delete(await refRelation(relation_id));
        else await batch.set(await refRelation(relation_id), relation);
    }

    async function dropSpouse(family_id, spouse_id) {
        const relation = await loadRelation(family_id);
        relation.parents.remove(spouse_id);

        const batch = await db.batch();
        await editRelation(batch, family_id, relation);
        if ((await getRelations(spouse_id)).size == 1 &&
            (await getParents(spouse_id)).size == 0)
            await batch.delete(await refMember(spouse_id));
        await batch.commit();
        return true;
    }
    
    async function dropChild(family_id, child_id) {
        const relations = await getRelations(child_id);
        if (relations.size > 0) return false;
    
        const relation = await loadRelation(family_id);
        relation.children.remove(child_id);
    
        const batch = await db.batch();
        await editRelation(batch, family_id, relation);
        await batch.delete(await refMember(child_id));
        await batch.commit();
        return true;
    }

    return {
        initMember: initMember,
        loadMember: loadMember,
        saveMember: saveMember,
        loadFamily: loadFamily,
        saveChild: saveChild,
        saveSpouse: saveSpouse,
        dropChild: dropChild,
        dropSpouse: dropSpouse
    };
}
