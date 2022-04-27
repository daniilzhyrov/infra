const express = require ('express');
const mongoose = require("mongoose");
const User = require('../models/user');

const router = express.Router();

router.use((req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }
    next();
})

router.post('/:id/delete',
    (req, res, next) => {
        if (req.user.role != 1 && req.user.id != req.params.id) {
            res.sendStatus(403);
            return;
        }
        next();
    },
    async (req, res) => {
        try {
            await User.deleteById(req.params.id)
            if (req.user.id == req.params.id) {
                req.logout();
                res.redirect('/');
                return;
            }
            res.redirect('/users');
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });

router.use('/:id', async (req, res) => {
    try {
        let id = req.params.id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.sendStatus(404)
            return
        }
        let foundUser = await User.getById(id)
        if (foundUser == undefined) {
            res.sendStatus(404)
            return
        }
        let user = {
            id : foundUser._id,
            fullname : foundUser.fullname,
            login : foundUser.login,
            registeredAt: new Date (foundUser.registeredAt).toLocaleString(),
            role : (foundUser.role == 0)?"User":"Administrator"
        };
        if (req.user.role == User.UserRoles.Admin)
            user.role = [
                {
                    roleId : 0,
                    roleName : "User",
                    current : foundUser.role == 0
                },{
                    roleId : 1,
                    roleName : "Waiter",
                    current : foundUser.role == 1
                },{
                    roleId : 2,
                    roleName : "Administrator",
                    current : foundUser.role == 2
                }];
        res.render(`user`, {user : user,
                            owner : user.id.equals(req.user._id),
                            canMakeChanges : user.id.equals(req.user._id) || req.user.role == 1});
    } catch (err) {
        console.error(err);
        res.render(`user`, {error : true});
    }
});

router.use((req, res, next) => {
    if (req.user.role != User.UserRoles.Admin) {
        res.sendStatus(403);
        return;
    }
    next();
});

router.post ('/:id/update', async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.sendStatus(404);
            return
        }
        if (Object.keys(req.body).length != 1 || !req.body.role) {
            res.sendStatus(403);
            return;
        }
        await User.update(id, req.body);
        res.redirect('/users/'+id);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.use(async (req, res) => {
    try {
        const NumberOfRecordsOnAPage = 8;
        const query = req.query.query;
        if (query && query.length > 32) {
            res.sendStatus(404);
            return;
        }
        const amountOfRecords = await User.getNumberOfRecords(query);
        let page = req.query.page
        if (!page) {
            res.redirect(303, "/users?page=1&".concat((query != undefined) ? "&query=" + query : ""));
            return;
        }
        if (isNaN (page) || page <= 0 || page > Math.floor((amountOfRecords + NumberOfRecordsOnAPage - 1)/NumberOfRecordsOnAPage)) {
            res.sendStatus(404);
            return;
        }
        page = Number (page);
        const users = await User.getRecordsPaginated(page, NumberOfRecordsOnAPage, query);
        let usersToReturn = [];
        for (let user of users) {
            usersToReturn.push({
                id : user._id,
                login : user.login,
                fullname : user.fullname,
                role : (user.role == 0) ? "User" : "Administrator"
            });
        }
        let pages = [];
        for (let i = 1; i <= Math.floor((amountOfRecords + NumberOfRecordsOnAPage - 1)/NumberOfRecordsOnAPage); i++)
            pages.push({
                page : i,
                current : page == i
            });
        res.render('users', { users : usersToReturn,
                                pages : pages,
                                prevPage : (page == 1) ? undefined : page - 1,
                                nextPage : (page + 1 > pages.length ? undefined : page + 1),
                                showPageSelector : pages.length > 1,
                                query : query});
    } catch (err) {
        console.error(err);
        res.render('users', { error : true});
    }
});

module.exports = router;