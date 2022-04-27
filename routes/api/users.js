const express = require ('express');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const Utils = require('./utils');
const config = require('../../config');
const User = require('../../models/user');
const ItemToOrder = require('../../models/itemToOrder');
const Order = require('../../models/order');

const router = express.Router();

router.put('/:id', async (req, res) => {
    const id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_users : "/api/v1/users/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundUser = await User.getById(id)
        if (foundUser == undefined) {
            res.status(404).send(toSend);
            return;
        }
        toSend._links.user = "/api/v1/users/" + id;
        let source = req.body;
        let changes = {}
        if (source.login)
            changes.login = source.username.trim();
        if (source.fullname)
            changes.fullname = source.fullname.trim();
        if (source.password)
            changes.password = source.password.trim();
        if (source.role)
            changes.role = source.role.trim();
        if (source.isDisabled)
            changes.isDisabled = source.isDisabled.trim();
        if (source.telegramId)
            changes.telegramId = source.telegramId.trim();
        if ((changes.role && changes.role != User.UserRoles.User || changes.isDisabled != undefined || req.user._id != id) && req.user.role != User.UserRoles.Admin) {
            toSend.message = "You have no right to perform this action";
            res.status(403).send(toSend);
            return;
        }
        if (changes.role) {
            let roleValueCorrect = false;
            for (let role of Object.values(User.UserRoles))
                if (changes.role == role) {
                    roleValueCorrect = true;
                    break;
                }
            if (!roleValueCorrect) {
                toSend.message = "Incorrect role value entered";
                res.status(406).send(toSend);
                return;
            }
        }
        if (changes.isDisabled && changes.isDisabled !== true && changes.isDisabled !== false) {
            toSend.message = "isDisabled must be boolean value";
            res.status(406).send(toSend);
            return;
        }
        if (changes.telegramId) {
            if (changes.telegramId.length != 9 || isNaN(changes.telegramId)) {
                toSend.message = "telegramId must be Numeric 9 digits value";
                res.status(406).send(toSend);
                return;
            }
            const user = await User.getByTelegramId(changes.telegramId);
            if (user || req.user.role == User.UserRoles.User) {
                toSend.message = "You have no right to perform this action";
                res.status(403).send(toSend);
                return;
            }
        }
        if (Math.max(changes.fullname, changes.password) > 32) {
            toSend.message = "Some values are too long. Max length is 32 symbols.";
            res.status(406).send(toSend);
            return;
        }
        if (changes.username) {
            toSend.message = "You can't change username after registration";
            res.status(406).send(toSend);
            return;
        }
        if (req.query.option == "startNewOrder") {
            const order = await Order.insert(new Order(id, []));
            changes.currentOrder = order._id;
            toSend.new_order = Order.getOrderToReturn(order);
        }
        if (req.query.option == "setCurrentOrderCompleted" && req.user.role != User.UserRoles.User)
            changes.currentOrder = null;
        if (source.new_item_to_order) {
            const new_item_id = source.new_item_to_order;
            if (!mongoose.Types.ObjectId.isValid(new_item_id)) {
                toSend.message = "'new_item_to_order' is invalid";
                res.status(404).send(toSend);
                return;
            }
            if (!(await ItemToOrder.getById(new_item_id))) {
                toSend.message = "'new_item_to_order' record with such id does not exist";
                res.status(404).send(toSend);
                return;
            }
            const user = await User.getById(id)
            if (!mongoose.Types.ObjectId.isValid(user.currentOrder)) {
                const order = await Order.insert(new Order(id, [new_item_id]));
                changes.currentOrder = order._id;
            } else {
                const order = await Order.getById(user.currentOrder);
                order.items.push(new_item_id);
                await Order.update(order._id, order);
            }
        }
        await User.update(id, changes);
        toSend.jwt = jwt.sign(User.getUserToReturn(await User.getById(id)), config.secret);
        toSend.message = "Updated successfully";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.delete('/:id', async (req, res) => {
    let id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_users : "/api/v1/users/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundUser = await User.getById(id)
        if (foundUser == undefined) {
            res.status(404).send(toSend);
            return;
        }
        toSend._links.user = "/api/v1/users/" + id;
        if (req.user._id != id && req.user.role != User.UserRoles.Admin) {
            toSend.message = "You have no right to perform this action";
            res.status(403).send(toSend);
            return;
        }
        await User.deleteById(id);
        toSend.message = "Deleted successfully";
        if (req.user.id == id)
            req.logout();
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.get('/:id', async (req, res) => {
    let id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_users : "/api/v1/users/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(406).send(toSend);
            return;
        }
        let foundUser = await User.getById(id);
        if (foundUser == undefined)
            res.status(404).send(toSend);
        else {
            if (req.user.role == User.UserRoles.Admin || req.user.id == id) {
                toSend._links.delete = req.originalUrl.concat("/delete");
                toSend._links.update = req.originalUrl.concat("/update");
            }
            const user = User.getUserToReturn(foundUser);
            user.amountOfOrders = await Order.getNumberOfRecords(user.id);
            if (user.currentOrder)
                user.currentOrder = Order.getOrderToReturn(await Order.getById(user.currentOrder));
            toSend.user = user;
            if (req.user.role != User.UserRoles.Admin)
                delete toSend.user.telegramId;
            res.send(toSend);
        }
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.get('/', Utils.checkAdmin, async (req, res) => {
    try {
        let page = req.query.page;
        let numberOfRecordsOnAPage = req.query.numberOfRecordsOnAPage;
        let query = req.query.query;
        const amountOfRecords = await User.getNumberOfRecords((query && query.length <= 32) ? query : "");
        let toSend = {
            _links : {
                self : req.originalUrl
            }
        }
        if (amountOfRecords > 0)
            toSend.first_page = req.baseUrl.concat("?page=1&numberOfRecordsOnAPage=").concat(!isNaN(numberOfRecordsOnAPage) && numberOfRecordsOnAPage > 0 ? numberOfRecordsOnAPage : 8);
        if (!page || !numberOfRecordsOnAPage) {
            res.redirect(303, 'users?page='.concat(page ? page : 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage ? numberOfRecordsOnAPage : 8));
            return;
        }
        if (isNaN(page) || page <= 0 || isNaN(numberOfRecordsOnAPage) || numberOfRecordsOnAPage <= 0) {
            res.status(404).json(toSend);
            return;
        }
        if (!query)
            query = "";
        query = query.trim();
        if (query.length > 32) {
            toSend.message = "Search phrase is too long";
            res.status(406).json(toSend);
            return;
        }
        page = Number(page);
        numberOfRecordsOnAPage = Number(numberOfRecordsOnAPage);
        let users = await User.getRecordsPaginated(page, numberOfRecordsOnAPage, query);
        for (let user in users) {
            users[user] = User.getUserToReturn(users[user]);
            users[user]._links = {
                self : req.baseUrl.concat("/").concat(users[user].id)
            }
        }
        toSend.users = users;
        if (page && page > 1) 
            toSend._links.prev_page = req.baseUrl.concat("?page=").concat(page - 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (page && page < Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage))
            toSend._links.next_page = req.baseUrl.concat("?page=").concat(page + 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (amountOfRecords > 0)
            toSend._links.last_page = req.baseUrl.concat("?page=").concat(Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage)).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        toSend.numberOfRecords = await User.getNumberOfRecords(query);
        res.send(toSend);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message : "Internal server error"
        });
    }
});

module.exports = router;