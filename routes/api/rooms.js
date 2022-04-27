const express = require ('express');
const mongoose = require("mongoose");
const router = express.Router();

const Utils = require('./utils');
const Room = require('../../models/room');
const Restaurant = require('../../models/restaurant');

router.use (Utils.checkAdmin);

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(406).send(toSend);
            return;
        }
        const room = await Room.getById(id);
        if (!room) {
            toSend.message = "Record with such id does not exist";
            res.status(404).send(toSend);
            return;
        }
        toSend.room = Room.getToReturn(room);
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.put ('/:id', async (req, res) => {
    const id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl
        }
    };
    try {
        const source = req.body;
        const restaurantId = source.restaurant_id;
        const name = source.name;
        const description = source.description;
        const amountOfTables = source.amountOfTables;
        
        if (restaurantId && typeof restaurantId != 'string' || name && typeof name != 'string' || description && typeof description != 'string') {
            toSend.message = "All the values must be type of string";
            res.status(406).json(toSend);
            return;
        }
        if (restaurantId && !mongoose.Types.ObjectId.isValid(restaurantId)) {
            toSend.message = "Restaurant id is invalid";
            res.status(406).send(toSend);
            return;
        }
        const restaurant = await Restaurant.get();
        if (restaurantId &&  String((restaurant)._id) != String(restaurantId)) {
            toSend.message = "Restaurant with such id doesn't exist";
            res.status(406).send(toSend);
            return;
        }
        if (name && (name.length > 16 || name.length == 0)) {
            toSend.message = "Name should consist of 1 up to 16 symbols";
            res.status(406).send(toSend);
            return;
        }
        if (description && (description.length > 64 || description.length == 0)) {
            toSend.message = "Description should consist of 1 up to 64 symbols";
            res.status(406).send(toSend);
            return;
        }
        if (amountOfTables && (isNaN(amountOfTables) || amountOfTables.length == 0 || amountOfTables.length > 32 || amountOfTables < 0)) {
            toSend.message = "incorrect 'amountOfTables' value";
            res.status(406).send(toSend);
            return;
        }
        let changes = {};
        if (name)
            changes.name = name;
        if (description)
            changes.description = description;
        if (amountOfTables)
            changes.amountOfTables = amountOfTables;
        if (restaurantId)
            changes.restaurantId = restaurantId;
        await Room.updateById(id, changes);
        toSend.message = "Updated successfully";
        res.json(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(406).send(toSend);
            return;
        }
        const room = await Room.getById(id);
        if (!room) {
            toSend.message = "Record with such id does not exist";
            res.status(404).send(toSend);
            return;
        }
        await Room.deleteById(id);
        toSend.room = Room.getToReturn(room);
        toSend.message = "Successfully deleted";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.get('/', async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl
        }
    };
    try {
        const source = req.query;
        const restaurantId = source.restaurant_id;
        const page = source.page;
        const numberOfRecordsOnAPage = source.numberOfRecordsOnAPage;
        if (restaurantId) {
            if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
                toSend.message = "Id is invalid";
                res.status(406).send(toSend);
                return;
            }
            if (String((await Restaurant.get())._id) != String(restaurantId)) {
                toSend.message = "Restaurant with such id doesn't exist";
                res.status(406).send(toSend);
                return;
            }
        }

        if (page && (isNaN(page) || Number(page) < 0)) {
            toSend.message = "Page is invalid";
            res.status(406).send(toSend);
            return;
        }

        if (numberOfRecordsOnAPage && (isNaN(numberOfRecordsOnAPage) || Number(numberOfRecordsOnAPage) < 0)) {
            toSend.message = "'numberOfRecordsOnAPage' value is invalid";
            res.status(406).send(toSend);
            return;
        }

        toSend.numberOfRecords = await Room.getNumberOfRecords(restaurantId);
        const rooms = await Room.getAll(page, numberOfRecordsOnAPage, restaurantId);
        const roomsToReturn = [];
        for (let room of rooms)
            roomsToReturn.push(Room.getToReturn(room));
        toSend.rooms = roomsToReturn;
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.post ('/', async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl
        }
    };
    try {
        const source = req.body;
        const restaurantId = source.restaurant_id;
        const name = source.name;
        const description = source.description;
        
        if (!restaurantId || !name || !description) {
            toSend.message = "You should clarify all the fields";
            res.status(406).json(toSend);
            return;
        }
        if (typeof restaurantId != 'string' || typeof name != 'string' || typeof description != 'string') {
            toSend.message = "All the values must be type of string";
            res.status(406).json(toSend);
            return;
        }
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            toSend.message = "Restaurant id is invalid";
            res.status(406).send(toSend);
            return;
        }
        const restaurant = await Restaurant.get();
        if (String((restaurant)._id) != String(restaurantId)) {
            toSend.message = "Restaurant with such id doesn't exist";
            res.status(406).send(toSend);
            return;
        }
        if (name.length > 16 || name.length == 0) {
            toSend.message = "Name should consist of 1 up to 16 symbols";
            res.status(406).send(toSend);
            return;
        }
        if (description.length > 64 || description.length == 0) {
            toSend.message = "Description should consist of 1 up to 64 symbols";
            res.status(406).send(toSend);
            return;
        }
        const room = await Room.insert(new Room(name, description, restaurantId));
        toSend.message = "Created successfully";
        toSend.new_room = Room.getToReturn(room);
        res.json(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

module.exports = router;