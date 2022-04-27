const express = require ('express');
const cloudinary = require('cloudinary').v2;
const config = require("../config");

const Restaurant = require("../models/restaurant");

const router = express.Router();

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

// router.use((req, res, next) => {
//     if (!req.user) {
//         res.sendStatus(401);
//         return;
//     }
//     if (req.user.role != User.UserRoles.Admin) {
//         res.sendStatus(403);
//         return;
//     }
//     next();
// });

router.get('/rooms', (req, res) => {
    res.render('rooms');
});

router.post('/', async (req, res) => {
    try {
        const data = req.body;
        let query = {
            current_contacts : data.restaurant_contacts,
            current_address : data.restaurant_address
        };
        if (!data.restaurant_name || !data.restaurant_address || !data.restaurant_contacts) {
            query.emptyFieldsError = true;
            res.render('settings', query);
            return;
        }
        if (Math.max(data.restaurant_name.length, data.restaurant_address, data.restaurant_contacts) > 32) {
            query.longValuesError = true;
            res.render('settings', query);
            return;
        }
        if (Math.max(data.restaurant_name, data.restaurant_address, data.restaurant_contacts) > 32) {
            query.longValuesError = true;
            res.render('settings', query);
            return;
        }
        if (req.files.image) {
            if (req.files.image.truncated) {
                query.fileSizeError = true;
                res.render('settings', query);
                return;
            }
            if (req.files.image.mimetype != 'image/jpeg') {
                query.fileTypeError = true;
                res.render('settings', query);
                return;
            }
        }
        if (!data.restaurant_name instanceof String || !data.restaurant_address instanceof String || !data.restaurant_contacts instanceof String) {
            query.requestError = true;
            res.render('settings', query);
            return;
        }

        let logoUrl = (await Restaurant.getRestaurant()).logoUrl;
        if (req.files.image) {
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
            logoUrl = response.secure_url;
        }
        
        await Restaurant.saveRestaurant(new Restaurant(data.restaurant_name, data.restaurant_contacts, data.restaurant_address, logoUrl));

        res.render('settings', query);
    } catch (err) {
        res.render('settings', {
            serverError : true
        });
        console.error(err);
    }
});

router.get('/', async (_req, res) => {
    const restaurant = await Restaurant.getRestaurant();
    res.render('settings', {
        current_contacts : restaurant.contacts,
        current_address : restaurant.address
    });
});

module.exports = router;