const express = require ('express');
const mongoose = require("mongoose");

const Utils = require('./utils');
const User = require('../../models/user');
const Order = require('../../models/order');
const ItemToOrder = require ('../../models/itemToOrder');

const router = express.Router();

router.post('/', Utils.checkAdmin, async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_orders : "/api/v1/orders/",
        }
    };
    try {
        let source = req.body;
        let data = {}
        if (source.customer_id)
            data.customerId = source.customer_id.trim();
        if (source.items)
            data.items = source.items.trim();
        if (!data.customerId)
            data.customerId = req.user._id;
        if (!data.items) {
            toSend.message = "You should clarify all the data to proceed";
            res.status(406).send(toSend);
            return;
        }
        if (!mongoose.Types.ObjectId.isValid(data.customerId)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        if (!(await User.getById(data.customerId))) {
            toSend.message = "Customer with such id does not exist";
            res.status(404).send(toSend);
            return;
        }
        data.items = data.items.split(',');
        let setItems = new Set();
        for (let item of data.items) {
            if (!mongoose.Types.ObjectId.isValid(item)) {
                toSend.message = "One of item ids is invalid";
                res.status(404).send(toSend);
                return;
            }
            if (!(await ItemToOrder.getById(item))) {
                toSend.message = `Item with id ${item} does not exist`;
                res.status(404).send(toSend);
                return;
            }
            setItems.add(item);
        }
        data.items = Array.from(setItems);
        toSend.new_order_id = (await Order.insert(data))._id;
        toSend.message = "Created successfully";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.put('/:id', async (req, res) => {
    let id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_orders : "/api/v1/orders/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundOrder = await Order.getById(id)
        if (foundOrder == undefined) {
            res.status(404).send(toSend);
            return;
        }
        toSend._links.self = "/api/v1/order/" + id;
        if (req.user.role == User.UserRoles.User && req.user._id != foundOrder.customerId) {
            toSend.message = "Not Your order";
            res.status(403).send(toSend);
            return;
        }
        let source = req.body;
        let changes = {}
        if (source.customer_id) {
            changes.customerId = source.customer_id.trim();
            if (!mongoose.Types.ObjectId.isValid(changes.customerId)) {
                toSend.message = "Customer id is invalid";
                res.status(404).send(toSend);
                return;
            }
            if (!(await User.getById(changes.customerId))) {
                toSend.message = "Customer with such id does not exist";
                res.status(404).send(toSend);
                return;
            }
        }
        if (source.items) {
            changes.items = source.items.trim().split(',');
            let setItems = new Set();
            for (let item of changes.items) {
                if (!mongoose.Types.ObjectId.isValid(item)) {
                    toSend.message = "One of item ids is invalid";
                    res.status(404).send(toSend);
                    return;
                }
                if (!(await ItemToOrder.getById(item))) {
                    toSend.message = `Item with id ${item} does not exist`;
                    res.status(404).send(toSend);
                    return;
                }
                setItems.add(item);
            }
            changes.items = Array.from(setItems);
        }
        await Order.update(id, changes);
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
            all_orders : "/api/v1/orders/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundOrder = await Order.getById(id)
        if (foundOrder == undefined) {
            res.status(404).send(toSend);
            return;
        }
        if (req.user.role == User.UserRoles.User && String(req.user._id) != String(foundOrder.customerId)) {
            toSend.message = "You have no right to access this page";
            res.status(403).send(toSend);
            return;
        }
        toSend._links.order = "/api/v1/order/" + id;
        await Order.deleteById(id);
        toSend.message = "Deleted successfully";
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
            all_orders : "/api/v1/orders/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundOrder = await Order.getById(id)
        if (foundOrder == undefined)
            res.status(404).send(toSend);
        else {
            if (req.user.role == 1 || req.user._id == id) {
                toSend._links.delete = req.originalUrl.concat("/delete");
                toSend._links.update = req.originalUrl.concat("/update");
            }
            toSend.order = Order.getOrderToReturn(foundOrder);
            let items = [];
            for (let item of toSend.order.items) {
                items.push({
                    id : item,
                    _links : {
                        self : "/api/v1/itemsToOrder/".concat(item)
                    }
                });
            }
            toSend.order.items = items;
            toSend.order.customer = User.getUserToReturn(await User.getById(toSend.order.customerId));
            toSend.order.customer._links = {
                self : "/api/v1/users/".concat(toSend.order.customerId)
            };
            toSend.order.customerId = undefined;
            res.send(toSend);
        }
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.get('/', async (req, res) => {
    try {
        const toSend = {
            _links : {
                self : req.originalUrl,
            }
        }

        let page = req.query.page;
        let numberOfRecordsOnAPage = req.query.numberOfRecordsOnAPage;
        let option = req.query.option;
        const customerId = req.user._id;

        const amountOfRecords = await Order.getNumberOfRecords(customerId);

        if (option && option == "onlyAmount") {
            toSend.amountOfRecords = amountOfRecords;
            res.json(toSend);
            return;
        }

        if (amountOfRecords > 0)
            toSend.first_page = req.baseUrl.concat("?page=1&numberOfRecordsOnAPage=").concat(!isNaN(numberOfRecordsOnAPage) && numberOfRecordsOnAPage > 0 ? numberOfRecordsOnAPage : 8);
        if (!page || !numberOfRecordsOnAPage) {
            res.redirect('?page='.concat(page ? page : 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage ? numberOfRecordsOnAPage : 8));
            return;
        }
        if (isNaN(page) || page <= 0 || isNaN(numberOfRecordsOnAPage) || numberOfRecordsOnAPage <= 0) {
            res.status(404).json(toSend);
            return;
        }
        page = Number(page);
        numberOfRecordsOnAPage = Number(numberOfRecordsOnAPage);
        let orders = await Order.getRecordsPaginated(page, numberOfRecordsOnAPage, customerId);
        for (let order in orders) {
            orders[order] = Order.getOrderToReturn(orders[order]);
            orders[order]._links = {
                self : req.baseUrl.concat("/").concat(orders[order].id)
            }
            const items = [];
            for (let item of orders[order].items)
                items.push(ItemToOrder.getItemToReturn(item));
            orders[order].items = items;
        }
        toSend.orders = orders;
        toSend.amountOfRecords = amountOfRecords;
        if (page && page > 1) 
            toSend._links.prev_page = req.baseUrl.concat("?page=").concat(page - 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (page && page < Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage))
            toSend._links.next_page = req.baseUrl.concat("?page=").concat(page + 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (amountOfRecords > 0)
            toSend._links.last_page = req.baseUrl.concat("?page=").concat(Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage)).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        res.send(toSend);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message : "Internal server error"
        });
    }
});

module.exports = router;