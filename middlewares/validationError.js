'use strict';

const validationErrorObj = (errorString) => {
    const responseArr = [];
    const result = errorString.replace(/\:/,'&').split('&');
    const response = result[1].split(/, (?=[^,]+:)/).map(s => s.split(': '));
    const obj = objectify(response);
    responseArr.push(obj);
    
    return responseArr;
};

const objectify = (array) => {
    return array.reduce(function(p, c) {
        p[c[0]] = c[1];
        return p;
   }, {});
}

module.exports = {
    validationErrorObj
};