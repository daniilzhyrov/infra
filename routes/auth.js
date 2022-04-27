const express = require ('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require("passport-jwt");

const config = require ('../config');
const User = require ('../models/user');

const router = express.Router();

const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.serializeUser((user, doneCB) => {
    doneCB(null, user.id);
});

passport.deserializeUser(async (id, doneCB) => {
    const user = await User.getById(id);
    if (!user)
        doneCB("No user");
    else
        doneCB(null, user);
});

passport.use(new LocalStrategy(async (username, password, doneCB) => {
    try {
        const user = await User.getByLoginAndPass(username, password);
        if (!user)
            doneCB(null, false);
        else
            doneCB(null, user);
    } catch (err) {
        console.error(err);
        doneCB(err);
    }
}));

passport.use(new JWTStrategy({
       jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
       secretOrKey   : config.secret
   }, async (user, cb) => {
        try {
            cb(null, await User.getById (user.id));
        } catch (err) {
            console.error(err);
            cb(err);
        }
   }
));

router.post("/logout", (req, res) => {
    req.logout();
    res.redirect('/');
});

router.use ((req, res, next) => {
    if (req.user) {
        res.render('login', {
            alreadySignedInWarning : true
        });
        return;
    }
    next();
})

router.get("/register", (req, res) => {
    let query = {}
    query[req.query.error] = true;
    res.render('register', query);
});

router.post("/register", async (req, res) => {
    let login = req.body.login.trim().toLowerCase();
    let fullname = req.body.fullname.trim();
    let password = req.body.password.trim();
    if (!login || !fullname || !fullname) {
        res.json({
            error : 'fieldsWasNotFilledError'
        });
        return;
    }
    if (Math.max(login.length, fullname.length, password.length) > 32) {
        res.json({
            error : 'valuesAreTooLongError'
        });
        return;
    }
    if (login.includes(' ')) {
        res.json({
            error : 'loginMustBeASingleWordError'
        });
        return;
    }
    if (await (User.getByLogin(login))) {
        res.json({
            error : 'loginIsAlreadyUsedError'
        });
        return;
    }
    try {
        await User.insert(new User(login, fullname, password))
        res.json({})
    } catch (err) {
        console.error(err);
        res.json({
            error : 'serverError'
        });
    }
});

router.get("/login", (req, res) => {
    let query = {};
    query[req.query.error] = true;
    query.redirect = req.query.redirect;
    query[req.query.info] = true;
    query.info = req.query.info;
    res.render('login', query);
});

router.post("/login", (req, res) => {
    passport.authenticate('local', function(err, user) {
        if (err) {
            console.error(err);
            return res.json({
                error : 'serverError'
            });
        }
        if (!user)
            return res.json({
                error : 'loginOrPasswordIsIncorrectError'
            });
        req.login(user, function(err){
            if (err) {
                console.error(err);
                return res.json({
                    error : 'serverError'
                });
            }
            res.json({
                token : jwt.sign(user.id, config.secret)
            });
        });
    }) (req, res);
});

module.exports = router;