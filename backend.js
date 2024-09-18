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

const getDocument = (group, id) => getDoc(doc(db, group, id));
const getDocuments = (group, field, operator, value) =>
    getDocs(query(collection(db, group), where(field, operator, value)));

const getMember = (id) => getDocument(MEMBERS, id);
const getMembers = (uid) => getDocuments(MEMBERS, 'userid', ARRAY_CONTAINS, uid);

const getRelations = (mid) => getDocuments(RELATIONS, 'parents', ARRAY_CONTAINS, mid);

export default {
    initMember: async () => {
        const Q = 'q';
        const id = new URL(location).searchParams.get(Q);
        if (id != undefined) {
            const member = await getMember(id);
            if (member.exists())
                return {
                    id: member.id,
                    details: member.data()
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
    },

    loadFamily: async (member_id) => {
        const families = [];
        const newFamily = (mid, fid) =>
            [{id: fid, holder_id: mid, children: []}][0];
        const relations = await getRelations(member_id);
        for (const doc of relations.docs) {
            const family = {
                id: doc.id,
                holder_id: member_id,
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
                        details: child.data()
                    });
            }
            families.push(family);
        }
        return families;
    }
}