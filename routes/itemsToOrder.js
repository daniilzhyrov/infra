const express = require ('express');
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const config = require("../config");
const ItemToOrder = require ('../models/itemToOrder');

const router = express.Router();

const DefaultImagePath = config.DefaultImagePath;

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

router.use((req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }
    next();
});

router.get('/new', function(_req, res) {
    res.render('add_new_item');
});

router.post('/new', async (req, res) => {
    try {
        if (!req.body.name || !req.body.description || !req.body.weight || !req.body.price || (req.files.image && (req.files.image.truncated || req.files.image.mimetype != 'image/jpeg'))) {
            res.render('add_new_item', {fieldsWasNotFilledError : !req.body.name || !req.body.description || !req.body.weight || !req.body.price,
                                        fileSizeError : req.files.image && req.files.image.truncated,
                                        fileTypeError : req.files.image && req.files.image.mimetype != 'image/jpeg'});
            return;
        }
        if (Math.max(req.body.name.length, req.body.price.length, req.body.weight.length) > 32 || req.body.description.length > 512) {
            res.render('add_new_item', {fieldsAreTooLongError : true});            
            return;
        }
        if (isNaN(req.body.weight) || isNaN(req.body.price)) {
            res.render('add_new_item', {dataTypeError : true});            
            return;
        }
        if (req.body.weight <= 0 || req.body.price <=0) {
            res.render('add_new_item', {numberValuesAreNotPositiveError : true});            
            return;
        }
        let item = await ItemToOrder.insert(new ItemToOrder(req.body.name.trim(), req.body.description.trim(), Number(req.body.weight), Number(req.body.price)))
        let id = item._id;
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
        res.redirect(id)
    } catch (err) {
        console.error(err);
        res.render('add_new_item', {serverError : true});
    }
});

router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(404).render('not_found');
            return
        }
        let foundItem = await ItemToOrder.getById(id)
        if (foundItem == undefined){
            res.status(404).render('not_found');
            return
        }
        let allItemsToOrder = await ItemToOrder.getAll()
        res.render(`itemToOrder`, { users : allItemsToOrder,
                                    item : foundItem,
                                    admin : req.user.role == 1});
    } catch(err) {
        console.error(err);
        res.render(`itemToOrder`, { users : undefined,
                                    item : undefined});
    }
});

router.post('/:id/delete', async (req, res) => {
    if (req.user.role != 1) {
        res.sendStatus(403);
        return;
    }
    try {
        let id = req.params.id
        if (!mongoose.Types.ObjectId.isValid(id) || !(await ItemToOrder.getById(id))) {
            res.status(404).render('not_found');
            return
        }
        let deletedItem = await ItemToOrder.deleteById(id)
        if (deletedItem.imageUrl != DefaultImagePath)
            await new Promise (function (resolve, reject) {
                cloudinary.uploader.destroy(id, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
            })
        res.redirect('/itemsToOrder');
    } catch (err)  {
        console.error(err);
        res.sendStatus(500);
    }
});

router.use(async (_req, res) => {
    res.render('itemsToOrder');
});

module.exports = router;