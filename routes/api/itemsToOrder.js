const express = require ('express');
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;

const Utils = require('./utils');
const ItemToOrder = require ('../../models/itemToOrder');

const router = express.Router();

router.post('/', Utils.checkAdmin, async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_items : "/api/v1/itemsToOrder/",
        }
    };
    try {
        let source = req.body;
        let data = {}
        if (source.name)
            data.name = source.name.trim();
        if (source.description)
            data.description = source.description.trim();
        if (source.weight)
            data.weight = source.weight.trim();
        if (source.price)
            data.price = source.price.trim();
        if (!data.name || !data.description || !data.weight || !data.price) {
            toSend.message = "You should clarify all the data to proceed";
            res.status(406).send(toSend);
        }
        if (isNaN(data.weight) || isNaN(data.price)) {
            toSend.message = "Weight and price must be numeric data";
            res.status(406).send(toSend);
            return;
        }
        if (Math.max(data.name.length, data.price.length, data.weight.length) > 32 || data.description.length > 512) {
            toSend.message = "Some values are too long. Name, price and weight should be no longer than 32 symbols, description - than 512";
            res.status(406).send(toSend);
            return;
        }
        if (req.files.image && req.files.image.truncated) {
            toSend.message = "Image is too large. Max image size 5mb.";
            toSend.error_code = 1;
            res.status(406).send(toSend);
            return;
        } 
        const id = (await ItemToOrder.insert(data))._id;
        if (req.files.image) {
            let response = await new Promise ((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {resource_type : 'image',
                     public_id : id},
                    (error, result) => {
                        if (error)
                            reject(error)
                        else
                            resolve(result)
                    }
                ).end(req.files.image.data)
            })
            await ItemToOrder.addImageUrlById (id, response.secure_url);
        }
        toSend.new_item_id = id;
        toSend.message = "Created successfully";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.put('/:id', Utils.checkAdmin, async (req, res) => {
    let id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_items : "/api/v1/itemsToOrder/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundItem = await ItemToOrder.getById(id)
        if (foundItem == undefined) {
            res.status(404).send(toSend);
            return;
        }
        toSend._links.item = "/api/v1/itemsToOrder/" + id;
        let source = req.body;
        let changes = {}
        if (source.name)
            changes.name = source.name.trim();
        if (source.description)
            changes.description = source.description.trim();
        if (source.weight)
            changes.weight = source.weight.trim();
        if (source.price)
            changes.price = source.price.trim();
        if (req.files.image) {
            if (req.files.image.truncated) {
                toSend.message = "Image is too large. Max image size 5mb.";
                toSend.error_code = 1;
                res.status(406).send(toSend);
                return;
            } 
            let response = await new Promise ((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {resource_type : 'image',
                     public_id : id},
                    (error, result) => {
                        if (error)
                            reject(error)
                        else
                            resolve(result)
                    }
                ).end(req.files.image.data)
            })
            await ItemToOrder.addImageUrlById (id, response.secure_url);
        }
        if ((changes.weight && isNaN(changes.weight)) || (changes.price && isNaN(changes.price))) {
            toSend.message = "Weight and price must be numeric data";
            res.status(406).send(toSend);
            return;
        }
        if (changes.name && changes.name.length > 32 || changes.price && changes.price.length > 32 || changes.weight && changes.weight.length > 32 || changes.description && changes.description.length > 512) {
            toSend.message = "Some values are too long. Name, price and weight should be no longer than 32 symbols, description - than 512";
            res.status(406).send(toSend);
            return;
        }
        await ItemToOrder.update(id, changes);
        toSend.message = "Updated successfully";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
});

router.delete('/:id', Utils.checkAdmin, async (req, res) => {
    let id = req.params.id;
    let toSend = {
        _links : {
            self : req.originalUrl,
            all_items : "/api/v1/itemsToOrder/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundItem = await ItemToOrder.getById(id)
        if (foundItem == undefined) {
            res.status(404).send(toSend);
            return;
        }
        toSend._links.item = "/api/v1/itemsToOrder/" + id;
        await ItemToOrder.deleteById(id);
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
            all_items : "/api/v1/itemsToOrder/",
        }
    };
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            toSend.message = "Id is invalid";
            res.status(404).send(toSend);
            return;
        }
        let foundItem = await ItemToOrder.getById(id)
        if (foundItem == undefined)
            res.status(404).send(toSend);
        else {
            if (req.user.role == 1) {
                toSend._links.delete = req.originalUrl.concat("/delete");
                toSend._links.update = req.originalUrl.concat("/update");
            }
            toSend.item = ItemToOrder.getItemToReturn(foundItem);
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
        let page = req.query.page;
        let numberOfRecordsOnAPage = req.query.numberOfRecordsOnAPage;
        let query = req.query.query;
        const amountOfRecords = await ItemToOrder.getNumberOfRecords((query && query.length <= 32) ? query : "");
        let toSend = {
            _links : {
                self : req.originalUrl
            }
        }
        if (amountOfRecords > 0)
            toSend.first_page = req.baseUrl.concat("?page=1&numberOfRecordsOnAPage=").concat(!isNaN(numberOfRecordsOnAPage) && numberOfRecordsOnAPage > 0 ? numberOfRecordsOnAPage : 8);
        if (!page || !numberOfRecordsOnAPage) {
            res.redirect(303, '?page='.concat(page ? page : 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage ? numberOfRecordsOnAPage : 8));
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
        let itemsToOrder = await ItemToOrder.getRecordsPaginated(page, numberOfRecordsOnAPage, query);
        for (let itemToOrder in itemsToOrder) {
            itemsToOrder[itemToOrder] = ItemToOrder.getItemToReturn(itemsToOrder[itemToOrder]);
            itemsToOrder[itemToOrder]._links = {
                self : req.baseUrl.concat("/").concat(itemsToOrder[itemToOrder].id)
            }
        }
        toSend.itemsToOrder = itemsToOrder;
        if (page && page > 1) 
            toSend._links.prev_page = req.baseUrl.concat("?page=").concat(page - 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (page && page < Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage))
            toSend._links.next_page = req.baseUrl.concat("?page=").concat(page + 1).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        if (amountOfRecords > 0)
            toSend._links.last_page = req.baseUrl.concat("?page=").concat(Math.floor((numberOfRecordsOnAPage + amountOfRecords - 1)/numberOfRecordsOnAPage)).concat("&numberOfRecordsOnAPage=").concat(numberOfRecordsOnAPage);
        toSend.amountOfRecords = amountOfRecords;
        res.send(toSend);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message : "Internal server error"
        });
    }
});

module.exports = router;