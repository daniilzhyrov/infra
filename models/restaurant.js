const mongoose = require ('mongoose');

const RestaurantSchema = new mongoose.Schema ({
    name : {type : String, required : true},
    contacts : {type : String, required : true},
    address : {type : String, required : true},
    logoUrl : {type : String, default : "/images/logo.png"}
});

const RestaurantModel = mongoose.model('Restaurant', RestaurantSchema);

class Restaurant {

    constructor(name, contacts, address, logoUrl) {
        this.name = name;
        this.contacts = contacts;
        this.address = address;
        this.logoUrl = logoUrl;
    }
 
    static get() {
        return RestaurantModel.findOne();
    }

    static create() {
        return new RestaurantModel(new Restaurant("Restaurant", '"Some contacts"', '"Some address"')).save();
    }

    static save(restaurant) {
        return RestaurantModel.findOneAndUpdate({}, restaurant, {
            useFindAndModify : false
        });
    }

    static getToReturn(restaurant) {
        let toReturn = {};
        toReturn.id = restaurant._id;
        toReturn.name = restaurant.name;
        toReturn.contacts = restaurant.contacts;
        toReturn.address = restaurant.address;
        toReturn.logoUrl = restaurant.logoUrl;
        return toReturn;
    }
 };
 
 module.exports = Restaurant;