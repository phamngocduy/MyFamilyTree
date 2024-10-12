//development config
const firebaseConfig = {
    apiKey: 'AIzaSyD4WlWqGQ2vpr5avhOi5RigRvCBfetbisg',
    authDomain: 'learn-firebase-6b3b4.firebaseapp.com',
    projectId: 'learn-firebase-6b3b4',
    storageBucket: 'learn-firebase-6b3b4.appspot.com',
    messagingSenderId: '176093873193',
    appId: '1:176093873193:web:2377cc57c19559d62e4838',
    measurementId: 'G-39QLEL08ER',
    googleId: '176093873193-3qt2s61p5n8bl4mpoa79k7ml0bfc08be.apps.googleusercontent.com'
};

const FIREBASE = 'https://www.gstatic.com/firebasejs/10.14.1';
const FIREBASEUI = 'https://www.gstatic.com/firebasejs/ui/6.1.1';

const firebaseUI = (ext) => `${FIREBASEUI}/firebase-ui-auth${ext}`;
const firebaseCompat = (lib) => `${FIREBASE}/firebase-${lib}-compat.js`;

async function importFirebase(lib) {
    return await import(`${FIREBASE}/firebase-${lib}.js`);
}

async function importVueJS() {
    return await import('./node_modules/vue/dist/vue.esm-browser.js');
}

const backendURL = 'http://127.0.0.1:5000';
