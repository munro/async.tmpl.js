module.exports = function (Template) {
    require('./tags')(Template);
    require('./filters')(Template);
};
