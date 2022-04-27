const express = require ('express');
const cloudinary = require('cloudinary').v2;

const config = require("../../config");
const User = require('../../models/user');
const Restaurant = require('../../models/restaurant');

const authRouter = require('./auth');
const usersRouter = require('./users');
const roomsRouter = require('./rooms');
const tablesRouter = require('./tables');
const ordersRouter = require('./orders');
const restaurantRouter = require('./restaurant');
const itemsToOrderRouter = require('./itemsToOrder');

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

const router = express.Router();

router.get('/callWaiter', async (req, res) => {
    try {
        const userId = req.query.user_id;
        const user = await User.getById(userId);
        const waiters = await User.getWaiters();
        for (let waiter of waiters) {
            Telegram.sendMessage({
                chat_id : waiter.telegramId,
                text : user.fullname + " called you, daniilzhyrov.herokuapp.com/users/" + user._id
            });
        }
    } catch(err) {
        console.error(err);
    }
    
    res.sendStatus(201);
})

router.get('/restaurant', async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            manage_tables : "/api/v1/restaurant/tables",
        }
    };
    try {
        const restaurant = await Restaurant.get();
        if (!restaurant)
            restaurant = await Restaurant.create();
        toSend.restaurant = Restaurant.getToReturn(restaurant);
        res.json(toSend);
    } catch(err) {
        console.error(err);
        toSend.message = "Server error occured";
        toSend.error_code = 500;
        res.json(toSend);
    }
});

router.use(authRouter);
router.use('/users', usersRouter);
router.use('/rooms', roomsRouter);
router.use('/orders', ordersRouter);
router.use('/tables', tablesRouter);
router.use('/restaurant', restaurantRouter);
router.use('/itemsToOrder', itemsToOrderRouter);

router.get('/me', (req, res) => {
    res.send(User.getUserToReturn(req.user));
});

router.get((_req, res) => {
    res.send({});
});

module.exports = router;