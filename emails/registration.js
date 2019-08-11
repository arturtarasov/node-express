const keys = require('../keys');

module.exports = function (email) {
    return {
        to: email,
        from: keys.EMIL_FROM,
        subject: 'Аккаунт создан',
        html: `
            <h1>Добро пожаловать - ${email}</h1>
            <a href="${keys.BASE_URL}">Магазин курсов</a>
        `
    }
}