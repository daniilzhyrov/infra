const express = require ('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

const Restaurant = require('../../models/restaurant');

const Utils = require('./utils');

router.use (Utils.checkAdmin);

router.put('/', async (req, res) => {
    let toSend = {
        _links : {
            self : req.originalUrl,
            restaurant_info : "/api/v1/restaurant/",
        }
    };
    try {
        let source = req.body;
        let changes = {}
        if (source.restaurant_name) {
            if (typeof source.restaurant_name !== 'string') {
                toSend.message = "Restaurant name must be a string";
                res.json(toSend);
                return;
            }
            changes.name = source.restaurant_name.trim();
            if (changes.name.length == 0 || changes.name.length > 32) {
                toSend.message = "Restaurant name must be from 1 to 32 symbols length";
                res.json(toSend);
                return;
            }
        }
        if (source.restaurant_address) {
            if (typeof source.restaurant_address !== 'string') {
                toSend.message = "Restaurant address must be a string";
                res.json(toSend);
                return;
            }
            changes.address = source.restaurant_address.trim();
            if (changes.address.length == 0 || changes.address.length > 32) {
                toSend.message = "Restaurant address must be from 1 to 32 symbols length";
                res.status(406).json(toSend);
                return;
            }
        }
        if (source.restaurant_contacts) {
            if (typeof source.restaurant_contacts !== 'string') {
                toSend.message = "Restaurant contacts must be a string";
                res.status(406).json(toSend);
                return;
            }
            changes.contacts = source.restaurant_contacts.trim();
            if (changes.contacts.length == 0 || changes.contacts.length > 32) {
                toSend.message = "Restaurant contacts must be from 1 to 32 symbols length";
                res.status(406).json(toSend);
                return;
            }
        }
        if (req.files.image) {
            if (req.files.image.truncated) {
                toSend = "Image is too large. Max file size 5 mb"
                res.status(406).json(toSend);
                return;
            }
            if (req.files.image.mimetype != 'image/jpeg') {
                toSend = "File type error"
                res.status(406).json(toSend);
                return;
            }

            let response = await new Promise ((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {resource_type : 'image',
                     public_id : "restaurant_logo"},
                    (error, result) => {
                        if (error)
                            reject(error)
                        else
                            resolve(result)
                    }
                ).end(req.files.image.data)
            });
            changes.logoUrl = response.secure_url;
        }

        await Restaurant.save(changes);
        toSend.message = "Updated successfully";
        res.send(toSend);
    } catch (err) {
        console.error(err);
        toSend.message = "Internal server error";
        res.status(500).send(toSend);
    }
})

module.exports = router;