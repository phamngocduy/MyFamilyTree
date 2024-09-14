ARRAY_CONTAINS = 'array-contains';
BLOCK = 'block';
DATE_PATTERN = '((0?[1-9]|1[0-9]|2[0-9])/(0?[1-9]|1[0-2])|30/(0?[13-9]|1[0-2])|31/(0?[13578]|1[02]))/(19|20)[0-9]{2}|((0?[1-9]|1[0-2])/)?(19|20)[0-9]{2}';
FLEX = 'flex';
INDEX_HTML = 'index.html';
INIT = 'init';
LOAD = 'load';
LOGIN_HTML = 'login.html';
MEMBERS = 'members';
NONE = 'none';
RELATIONS = 'relations';
USER = 'user';

Array.prototype.findById = function(id) {
    return this.find((element) => element.id == id);
}
Array.prototype.remove = function(element) {
    return this.splice(this.indexOf(element), 1);
}

function invoke(promise, callback, blocker=blockUI) {
    blocker(true);
    promise.then((value) => {
        if (callback) callback(value);
    }).catch((error) => {
        console.error(error);
        alert(error.message);
    }).finally(() => blocker(false));
}
function revoke(promise, callback) {
    invoke(promise, callback, blocker=loadUI);
}

function parseDate(ddmmyyyy) {
    ddmmyyyy = ddmmyyyy ?? `${new Date().getFullYear()}`;
    return Date.parse(ddmmyyyy.split('/').reverse().join('-'));
}
function toCanChi(ddmmyyyy) {
    const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
    const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mẹo', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
    try {
        const year = parseInt(ddmmyyyy.split('/').pop());
        return CAN[year % 10] + ' ' + CHI[year % 12];
    } catch (e) { }
}
