ARRAY_CONTAINS = 'array-contains';
DATE_PATTERN = '((0?[1-9]|1[0-9]|2[0-9])/(0?[1-9]|1[0-2])|30/(0?[13-9]|1[0-2])|31/(0?[13578]|1[02]))/(19|20)[0-9]{2}|((0?[1-9]|1[0-2])/)?(19|20)[0-9]{2}';
EDITABLE = 'editable';
INDEX_HTML = 'index.html';
LOGIN_HTML = 'login.html';
MEMBERS = 'members';
RELATIONS = 'relations';

Array.prototype.findById = function(id) {
    return this.find((element) => element.id == id);
}
Array.prototype.remove = function(element) {
    return this.splice(this.indexOf(element), 1);
}

window.if = (condition, return1, return2) =>
    condition ? return1 : return2;

function invoke(promise, callback) {
    loadUI(true);
    promise.then((value) => {
        if (callback) callback(value);
    }).catch((error) => {
        console.error(error);
        alert(error.message);
    }).finally(() => loadUI(false));
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
