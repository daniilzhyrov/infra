const mongoose = require ('mongoose');

const Table = require('./table');

const RoomSchema = new mongoose.Schema ({
    restaurantId : {type : mongoose.Schema.ObjectId, required : true, ref: "Restaurant"},
    name : {type : String, required : true},
    description : {type : String, required : true},
    amountOfTables : {type : Number, required : true, default : 0}
});

const RoomModel = mongoose.model('Room', RoomSchema);

class Room {

    constructor(name, description, amountOfTables, restaurantId) {
        this.name = name;
        this.description = description;
        this.amountOfTables = amountOfTables;
        this.restaurantId = restaurantId;
    }

    static getAll(page, numberOfRecordsOnAPage, restaurantId) {
        page = Number (page);
        if (!page || page <= 0)
            page = undefined;
        numberOfRecordsOnAPage = Number (numberOfRecordsOnAPage);
        if (!numberOfRecordsOnAPage)
            numberOfRecordsOnAPage = 3;
        if (numberOfRecordsOnAPage <= 0)
            return null;
        return RoomModel.find({ restaurantId }).skip((page - 1) * numberOfRecordsOnAPage).limit(numberOfRecordsOnAPage).populate('tables');
    }

    static getNumberOfRecords(restaurantId) {
        return RoomModel.find({ restaurantId }).countDocuments();
    }
 
    static getById(id) {
        return RoomModel.findById(id);
    }

    static insert(room) {
        return new RoomModel(room).save();
    }

    static updateById(id, changes) {
        return RoomModel.findByIdAndUpdate(id, changes, {
            useFindAndModify : false
        });
    }

    static deleteById(id) {
        return RoomModel.findByIdAndDelete(id, {
            useFindAndModify : false
        });
    }

    static getToReturn(room) {
        let toReturn = {};
        toReturn.id = room._id;
        toReturn.restaurantId = room.restaurantId;
        toReturn.name = room.name;
        toReturn.description = room.description;
        toReturn.amountOfTables = room.amountOfTables;
        return toReturn;
    }
 };
 
 module.exports = Room;