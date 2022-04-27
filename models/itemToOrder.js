const mongoose = require('mongoose');

const DefaultImagePath = require('../config').DefaultImagePath;

const ItemSchema = new mongoose.Schema ({
    name : {type : String, required : true},
    description : {type : String, required : true},
    weight : {type : Number, required : true},
    price : {type : Number, required : true},
    imageUrl : {type : String, default : "/images/defaultItemImage.jpg"}
});

const ItemModel = mongoose.model('Item', ItemSchema);

class ItemToOrder {

    constructor(name, description, weight, price) {
        this.name = name;
        this.description = description;
        this.weight = weight;
        this.price = price;
        this.imageUrl = "/images/defaultItemImage.jpg"
    }

    static insert(itemToInsert) {
        return new ItemModel(itemToInsert).save();
    }

    static update(id, changes) {
        return ItemModel.findByIdAndUpdate(id, changes);
    }

    static deleteById(id) {
        return ItemModel.findByIdAndDelete(id);
    }
    
    static getById(id) {
        return ItemModel.findById(id);
    }
 
    static getAll() {
        return ItemModel.find();
    }

    static getNumberOfRecords(query) {
        if (!query)
            query = "";
        return ItemModel.find({name : { "$regex": query, "$options": "i" }}).countDocuments();
    }

    static getRecordsPaginated(page, numberOfRecordsOnAPage, query) {
        if (!query)
            query = "";
        page = Number (page);
        if (!page || page <= 0)
            return null;
        if (!numberOfRecordsOnAPage)
            numberOfRecordsOnAPage = 3;
        if (numberOfRecordsOnAPage <= 0)
            return null;
        return ItemModel.find({name : { $regex : query, $options: "i" }}).skip((page - 1) * numberOfRecordsOnAPage).limit(numberOfRecordsOnAPage);
    }

    static async addImageUrlById (id, url) {
        let item = await ItemToOrder.getById(id)
        item.imageUrl = url;
        await ItemToOrder.update(id, item);
        return item.id;
    }

    static getItemToReturn (item) {
        return {
            id : item._id,
            name : item.name,
            description : item.description, 
            weight : item.weight,
            price : item.price,
            imageUrl : item.imageUrl
        }
    }
 };
 
 module.exports = ItemToOrder;