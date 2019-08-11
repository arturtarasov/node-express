const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid');
const router = Router();
const User = require('../models/user');
const keys = require('../keys');
const reqEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');


const transporter = nodemailer.createTransport(sendgrid({
    apiKey: keys.SENDGRID_API_KEY
}));

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Авторизация',
        isLogin: true,
        loginError: req.flash('loginError'),
        registrError: req.flash('registrError')
    });
});

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login');
    });
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        const candidate = await User.findOne({email});

        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password);
            if (areSame) {
                req.session.user = candidate;
                req.session.isAuthenticated = true;
                req.session.save((err => {
                    if (err) { throw err; }
                    res.redirect('/');
                }));
            } else {
                req.flash('loginError', 'Неверный пароль');
                res.redirect('/auth/login#login');
            }
        } else {
            req.flash('loginError', 'Такого пользователя не существует');
            res.redirect('/auth/login#login');
        }
    } catch (e) {
        console.log(e);
    }
});

router.post('/registr', async (req, res) => {
    try {
        const {email, password, repeat, name} = req.body;
        const candidate = await User.findOne({email});
        if (candidate) {
            req.flash('registrError', 'Пользователь с таким email уже существует');
            res.redirect('/auth/login#registr');
        } else {
            const hashPassword = await bcrypt.hash(password, 10);
            const user = new User({
                email, name, password: hashPassword, cart: {items: []}
            });
            await user.save();
            await transporter.sendMail(reqEmail(email));
            res.redirect('/auth/login#login');
        }
    } catch (e) {
        console.log(e);
    }
});

router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Забыли пароль?',
        error: req.flash('error')
    });
});

router.post('/reset', (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Что-то пошло не так, повторите попытку позже');
                return res.redirect('auth/reset');
            }

            const token = buffer.token('hex');
            const candidate = await User.findOne({email: req.body.email});

            if (candidate) {
                candidate.resetToken = token;
                candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
                await candidate.save();
                await transporter.sendMail(resetEmail(candidate.email, token));
                res.redirect('auth/login');
            } else {
                req.flash('error', 'Такого email нет');
                res.redirect('/auth/reset');
            }
        });
    } catch (e) {
        console.log(e);
    }
});


module.exports = router;