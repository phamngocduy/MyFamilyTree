const {initializeApp} = await importFirebase('app');
const {getAuth, onAuthStateChanged, signOut} = await importFirebase('auth');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
    if (user != undefined) {
        user.signOut = () => invoke(signOut(auth));
        dispatchEvent(new CustomEvent('user', {detail: user}));
    }
    else location = LOGIN_HTML;
});

async function request(action, content) {
    try {
        const response = await fetch(backendURL, {
            method: 'POST',
            body: JSON.stringify({action, content}),
            headers: {'Content-type': 'application/json'}
        });
        if (response.ok) return await response.json();
        else throw new Error(response.status);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

const initMember = 'initMember';
const saveMember = 'saveMember';
const loadFamily = 'loadFamily';
const loadMember = 'loadMember';
const loadParents = 'loadParents';
const saveChild = 'saveChild';
const saveSpouse = 'saveSpouse';
const saveParent = 'saveParent';
const dropChild = 'dropChild';
const dropHolder = 'dropHolder';

export default {
    initMember: (query, user) => request(initMember, {query, user}),
    saveMember: (id, member) => request(saveMember, {id, member}),
    loadFamily: (member_id, recursive=true) => request(loadFamily, {member_id, recursive}),
    loadMember: (member_id) => request(loadMember, {member_id}),
    loadParents: (member_id) => request(loadParents, {member_id}),
    saveChild: (family_id, parent_id, child) => request(saveChild, {family_id, parent_id, child}),
    saveSpouse: (family_id, holder_id, spouse) => request(saveSpouse, {family_id, holder_id, spouse}),
    saveParent: (family_id, child_id, parent) => request(saveParent, {family_id, child_id, parent}),
    dropChild: (family_id, child_id) => request(dropChild, {family_id, child_id}),
    dropHolder: (family_id, holder_id) => request(dropHolder, {family_id, holder_id})
}