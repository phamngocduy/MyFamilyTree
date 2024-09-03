const firebaseConfig = {
    apiKey: 'AIzaSyD4WlWqGQ2vpr5avhOi5RigRvCBfetbisg',
    authDomain: 'learn-firebase-6b3b4.firebaseapp.com',
    projectId: 'learn-firebase-6b3b4',
    storageBucket: 'learn-firebase-6b3b4.appspot.com',
    messagingSenderId: '176093873193',
    appId: '1:176093873193:web:2377cc57c19559d62e4838',
    measurementId: 'G-39QLEL08ER',
    CLIENT_ID: '176093873193-3qt2s61p5n8bl4mpoa79k7ml0bfc08be.apps.googleusercontent.com'
};

const FIREBASE = 'https://www.gstatic.com/firebasejs/10.12.5';

async function importFirebase(lib) {
    return await import(`${FIREBASE}/firebase-${lib}.js`);
}

DATE_PATTERN = '((0?[1-9]|1[0-9]|2[0-9])/(0?[1-9]|1[0-2])|30/(0?[13-9]|1[0-2])|31/(0?[13578]|1[02]))/(19|20)[0-9]{2}|((0?[1-9]|1[0-2])/)?(19|20)[0-9]{2}';
