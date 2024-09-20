const {initializeApp} = await importFirebase('app');
const {getAuth, onAuthStateChanged, signOut} = await importFirebase('auth');
const {getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, query, where, writeBatch, deleteDoc} = await importFirebase('firestore');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
    if (user != undefined) {
        user.signOut = () => invoke(signOut(auth));
        dispatchEvent(new CustomEvent('user', {detail: user}));
    }
    else location = LOGIN_HTML;
});
const db = getFirestore(app);

const newBatch = () => writeBatch(db);
const ref = (group, id) => doc(db, group, id);
const select = (group) => collection(db, group);
const newDocument = (group) => doc(select(group));
const getDocument = (group, id) => getDoc(ref(group, id));
const setDocument = (group, id, document) => setDoc(ref(group, id), document);
const getDocuments = (group, ...clauses) => getDocs(query(select(group), clauses));

const newMember = () => newDocument(MEMBERS);
const refMember = (id) => ref(MEMBERS, id);
const getMember = (id) => getDocument(MEMBERS, id);
const setMember = (id, member) => setDocument(MEMBERS, id, member);
const getMembers = (uid) => getDocuments(MEMBERS, where('userid', ARRAY_CONTAINS, uid));

const newRelation = () => newDocument(RELATIONS);
const refRelation = (id) => ref(RELATIONS, id);
const getRelation = async (id) => (await getDocument(RELATIONS, id)).data();
const getRelations = (mid) => getDocuments(RELATIONS, where('parents', ARRAY_CONTAINS, mid));
const allRelations = (mid) => getDocuments(RELATIONS, where('parents', ARRAY_CONTAINS, mid),
                                                    where('children', ARRAY_CONTAINS, mid));
const getParents = (mid) => getDocuments(RELATIONS, where('children', ARRAY_CONTAINS, mid));

async function initRelation(relation_id, member_id) {
    const relation = relation_id ? await getRelation(relation_id) : {
        parents: [member_id], children: []
    }
    relation_id = relation_id ?? (await newRelation()).id;
    return [relation_id, relation, (await newMember()).id];
}

async function editRelation(batch, relation_id, relation) {
    if (relation.parents.length == 1 && relation.children.length == 0)
        await batch.delete(refRelation(relation_id));
    else await batch.set(refRelation(relation_id), relation);
}

export default {
    initMember: async (query, userid) => {
        if (query != undefined) {
            const member = await getMember(query);
            if (member.exists())
                return {
                    id: member.id,
                    details: member.data()
                };
        }
        const members = await getMembers(userid);
        if (members.size == 0) {
            const member = await addMember({
                userid: [user.uid],
                email: user.email,
                phone: user.phoneNumber,
                fullname: user[displayName] ?? 'Anonymous'
            });
        } else return {
            id: members.docs[0].id,
            details: members.docs[0].data()
        }
    },

    saveMember: async (id, member) =>
        await setMember(id, member),

    loadFamily: async (member_id) => {
        const families = [];
        const relations = await getRelations(member_id);
        for (const doc of relations.docs) {
            const family = {
                id: doc.id,
                children: []
            };
            const relation = doc.data();
            relation.parents.remove(member_id);
            if (relation.parents.length > 0) {
                const spouse = await getMember(relation.parents[0]);
                if (spouse.exists())
                    family.spouse = {
                        id: relation.parents[0],
                        details: spouse.data()
                    }
            }
            for (const child_id of relation.children) {
                const child = await getMember(child_id);
                if (child.exists())
                    family.children.push({
                        id: child_id,
                        details: child.data(),
                        families: []
                    });
            }
            families.push(family);
        }
        return families;
    },

    saveChild: async (family_id, parent_id, child) => {
        const [relation_id, relation, child_id] =
            await initRelation(family_id, parent_id);
        relation.children.push(child_id);
        
        const batch = await newBatch();
        await batch.set(refRelation(relation_id), relation);
        await batch.set(refMember(child_id), child);
        await batch.commit();
        return [relation_id, child_id];
    },

    saveSpouse: async (family_id, holder_id, spouse) => {
        const [relation_id, relation, spouse_id] =
            await initRelation(family_id, holder_id);
        relation.parents.push(spouse_id);

        const batch = await newBatch();
        await batch.set(refRelation(relation_id), relation);
        await batch.set(refMember(spouse_id), spouse);
        await batch.commit();
        return [relation_id, spouse_id];
    },

    dropChild: async (family_id, child_id) => {
        const relations = await allRelations(child_id);
        if (relations.size > 1) return false;
    
        const relation = await getRelation(family_id);
        relation.children.remove(child_id);
    
        const batch = await newBatch();
        await editRelation(batch, family_id, relation);
        await batch.delete(refMember(child_id));
        await batch.commit();
        return true;
    },

    dropSpouse: async (family_id, spouse_id) => {
        const relation = await getRelation(family_id);
        relation.parents.remove(spouse_id);

        const batch = await newBatch();
        await editRelation(batch, family_id, relation);
        if ((await allRelations(spouse_id)).size == 1)
            await batch.delete(refMember(spouse_id));
        await batch.commit();
        return true;
    }
}