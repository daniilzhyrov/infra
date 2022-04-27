const mongoose = require ('mongoose');

const OrderSchema = new mongoose.Schema ({
    customerId : {type : mongoose.Schema.ObjectId, required : true, ref: "User"},
    items : [{type : mongoose.Schema.ObjectId, required : true, ref: "Item"}]
});

const OrderModel = mongoose.model('Order', OrderSchema);

class Order {

    constructor(customerId, items) {
        this.customerId = customerId;
        this.items = items;
    }
 
    static getById(id) {
        return OrderModel.findById(id).populate('items');
    }
 
    static getAll() {
        return OrderModel.find();
    }

    static getNumberOfRecords(customerId) {
        return OrderModel.find({
            customerId
        }).countDocuments();
    }

    static getRecordsPaginated(page, numberOfRecordsOnAPage, customerId) {
        page = Number (page);
        if (!page || page <= 0)
            return null;
        if (!numberOfRecordsOnAPage)
            numberOfRecordsOnAPage = 3;
        if (numberOfRecordsOnAPage <= 0)
            return null;
        return OrderModel.find({
            customerId
        }).skip((page - 1) * numberOfRecordsOnAPage).limit(numberOfRecordsOnAPage).populate('items');
    }

    static insert(order) {
        return new OrderModel(order).save();
    }

    static update(id, changes) {
        return OrderModel.findByIdAndUpdate(id, changes);
    }

    static deleteById (id) {
        return OrderModel.findByIdAndDelete(id);
    }

    static getOrderToReturn (order) {
        return {
            id : order._id,
            customerId : order.customerId,
            items : order.items,
        }
    }
 };
 
 module.exports= Order;