const express = require ('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require("../../config");
const User = require('../../models/user');

const router = express.Router();

router.post("/login", (req, res) => {
    try {
        passport.authenticate('local', function(err, user) {
            if (err) {
                console.error(err);
                return res.json({
                    error : 'serverError'
                });
            }
            if (!user)
                return res.json({
                    message : 'Login or password was entered incorrectly',
                    error_code : 1
                });
            req.login(user, function(err){
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message : 'Server error occured'
                    });
                }
                res.json({
                    token : jwt.sign(User.getUserToReturn(user), config.secret)
                });
            });
        }) (req, res);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post('/register', async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            login : "/api/v1/auth/login",
        }
    };
    try {
        let source = req.body;
        if (!source.username || !source.fullname || !source.password) {
            toSend.message = "You must clarify username, fullname and password fields";
            toSend.error_code = 1;
            res.status(406).send(toSend);
            return;
        }
        let data = {}
        data.login = source.username.trim();
        data.fullname = source.fullname.trim();
        data.password = source.password.trim();
        if (source.role)
            data.role = source.role.trim();
        if (source.is_disabled)
            data.isDisabled = source.is_disabled.trim();
        if (source.telegramId)
            data.telegramId = source.telegramId.trim();
        if (((data.role && data.role != User.UserRoles.User) || (data.isDisabled && data.isDisabled != false)) && (!req.user || req.user.role != User.UserRoles.Admin) ) {
            toSend.message = "You have no right to set role and isDisabled flag";
            toSend.error_code = 2;
            res.status(403).send(toSend);
            return;
        }
        if (data.role) {
            let roleValueCorrect = false;
            if (!isNaN(data.role))
                for (let role of Object.value(User.UserRoles))
                    if (Number(data.role) == role) {
                        roleValueCorrect = true;
                        break;
                    }
            if (!roleValueCorrect) {
                toSend.message = "Incorrect role value entered";
                toSend.error_code = 3;
                res.status(406).send(toSend);
                return;
            }
        }
        if ((data.isDisabled && data.isDisabled != true) || (data.isDisabled && data.isDisabled != false)) {
            toSend.message = "isDisabled must be boolean value";
            toSend.error_code = 4;
            res.status(406).send(toSend);
            return;
        }
        if (data.telegramId) {
            toSend.message = "You cannot set telegramId during registration";
            toSend.error_code = 5;
            res.status(406).send(toSend);
            return;
        }
        if (Math.max(data.login, data.fullname, data.password) > 32) {
            toSend.message = "Some values are too long. Max length is 32 symbols.";
            toSend.error_code = 6;
            res.status(406).send(toSend);
            return;
        }
        if (await User.getByLogin(data.login)) {
            toSend.message = "Entered login is busy";
            toSend.error_code = 7;
            res.send(toSend);
            return;
        }
        toSend.message = "Registered successfully";
        toSend.registered_user_id = (await User.insert(data))._id;
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.use((req, res, next) => {
    passport.authenticate('jwt', {session: false}, async (err, user) => {
        if (err) {
            console.error(err);
            res.status(500).json({
                message : 'Internal server error'
            });
            return;
        }
        if (user)
            await new Promise ((resolve, reject) => {
                req.logIn(user, (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({
                            message : 'Internal server error'
                        });
                        reject();
                    }
                    resolve();
                });
            });
        next();
    }) (req, res, next);
}, (req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }
    next();
});

router.post("/logout", (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            login : "/api/v1/auth/login",
            register : "/api/v1/auth/register",
        }
    };
    try {
        req.logout();
        toSend.message = "You have signed out";
        res.json(toSend);
    } catch(err) {
        console.error(err);
        toSend.message = "Server error occured";
        res.status(500).json(toSend);
    }
});

module.exports = router;