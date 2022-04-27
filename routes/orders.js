const express = require ('express');
const mongoose = require("mongoose");
const User = require('../models/user');
const Order = require('../models/order');
const ItemToOrder = require ('../models/itemToOrder');

const router = express.Router();

router.get('/new', async (_req, res) => {
    try {
        let result = await Promise.all([User.getAll(), ItemToOrder.getAll()])
        res.render('add_new_order', {
            users : result[0],
            items : result[1]
        });
    } catch (err) {
        console.error (err)
        res.sendStatus(500);
    }
});

router.post('/new', async (req, res) => {
    try {
        let userId = req.body.user
        if (!userId) {
            res.send("You should select at least one user to proceed");
            return;
        }
        if (!mongoose.Types.ObjectId.isValid(userId) || !(await User.getById(userId))) {
            res.send("User was not created because of error in post query")
            return
        }
        let itemsId = [];
        for (let propName in req.body)
            if (propName != 'user') {
                if (!mongoose.Types.ObjectId.isValid(propName) || !(await ItemToOrder.getById(propName))) {
                    res.send("User was not created because of error in post query")
                    return
                }
                itemsId.push(propName);
            }
        if (!itemsId.length) {
            let result = await Promise.all([User.getAll(), ItemToOrder.getAll()])
            res.render('add_new_order', {
                noItemsSelectedError: true,
                users : result[0],
                items : result[1]
            });
            return;
        }
        await Order.insert(new Order(userId, itemsId))
        res.redirect('/orders');
    } catch(err)  {
        console.error(err);
        res.render('add_new_order', {
            serverError: true
        });
    }
});

router.use((req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }
    next();
})

router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.sendStatus(404);
            return
        }
        let orderIds = await Order.getById(id)
        if (!orderIds) {
            res.sendStatus(404);
            return
        }
        let order = {
            _id : orderIds._id,
            customer : await User.getById(orderIds.customerId),
            items : (await Promise.all(orderIds.items.map(itemId => ItemToOrder.getById(itemId)))).filter(item => item)
        }
        if (!order.customer || !order.items.length) {
            await Order.deleteById(req.params.id)
            res.send("Order was deleted because it does not contain items anymore or user, that made this order, was deleted");
            return;
        }
        let users = await User.getAll()
        for (let user of users)
            if (user._id.equals(orderIds.customerId))
                user.current = true;
        let items = await ItemToOrder.getAll()
        for (let item of items)
            if (orderIds.items.includes(item._id))
                item.checked = true;
        res.render('order', {
            order : order,
            users : users,
            items : items
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post('/:id/update', async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id) || !(await Order.getById(id))) {
            res.sendStatus(404);
            return
        }
        if (req.body) {
            let changes;
            if (req.body.customerId && mongoose.Types.ObjectId.isValid(req.body.customerId) && (await User.getById(req.body.customerId)) )
                changes = req.body
            else {
                changes = {
                    items : []
                }//await Order.getById(id)
                //changes.items = []
                for (let id in req.body)
                    if (mongoose.Types.ObjectId.isValid(id) && (await ItemToOrder.getById(id)))
                        changes.items.push(id)
            }
            if (changes)
                await Order.update(id, changes)
        }
        res.redirect(`/orders/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.post('/:id/delete', async (req, res) => {
    const id = req.params.id
    if (req.user.role != 1 && req.user.id != id) {
        res.sendStatus(403);
        return;
    }
    try {
        await Order.deleteById(id)
        let redirectLink = "/orders"
        if (req.body.page)
            redirectLink = redirectLink + "?page=" + req.body.page;
        res.redirect(redirectLink);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.use(async (req, res) => {
    try {
        let orders = await Order.getAll()
        let promises = []
        for (let order of orders) {
            let orderPromises = [Promise.resolve(order._id), User.getById (order.customerId)]
            let items = []
            for (let itemId of order.items)
                items.push(ItemToOrder.getById(itemId))
            orderPromises.push(Promise.all(items))
            promises.push (Promise.all(orderPromises))
        }
        let result = await Promise.all(promises)
        let ordersToReturn = []
        for (let order of result) {
            let items = order[2].filter(item => item).map(item => item.name);
            if (!order[1] || !items.length) {
                await Order.deleteById(order[0])
                continue;
            }
            ordersToReturn.push ({
                id : order[0],
                customerName : order[1].fullname,
                items : items
            })
        }
        let page = req.query.page;
        if (page && (isNaN (page) || page <= 0 || page > (ordersToReturn.length + 2)/3)) {
            res.sendStatus(404);
            return;
        }
        if (page == undefined)
            page = 1;
        page = Number (page);
        let neededOrders = [];
        for (let i = 0; i < 3; i++) {
            let ind = 3*(page - 1) + i
            if (ordersToReturn[ind] != undefined) {
                neededOrders.push(ordersToReturn[ind]);
            } else break;
        }
        let pages = [];
        for (let i = 1; i <= (ordersToReturn.length + 2)/3; i++)
            pages.push({page : i, current : page == i});
        res.render('orders', {orders : neededOrders,
                                    pages : pages,
                                    prevPage : (page == 1) ? undefined : page - 1,
                                    currentPage : page,
                                    nextPage : ((page + 1 > pages.length) ? undefined : page + 1),
                                    showPageSelector : pages.length > 1});
    } catch (err) {
        console.error(err);
        res.render('orders', {error : true});
    }
});

module.exports = router;