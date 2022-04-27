const mongoose = require ('mongoose');

const TableSchema = new mongoose.Schema ({
    roomId : {type : mongoose.Schema.ObjectId, required : true, ref: "Room"},
    position : {type : Object, required : true}
});

const TableModel = mongoose.model('Table', TableSchema);

class Table {

    constructor(roomId, position) {
        this.roomId = roomId;
        this.position = position;
    }
 
    static getById(id) {
        return TableModel.findById(id);
    }

    static insert(table) {
        return new TableModel(table).save();
    }

    static updateById(id, changes) {
        return TableModel.findByIdAndUpdate(id, changes, {
            useFindAndModify : false
        });
    }

    static getToReturn(table) {
        let toReturn = {};
        toReturn.id = table._id;
        toReturn.roomId = table.roomId;
        toReturn.position = table.position;
        return toReturn;
    }
 };
 
 module.exports = Table;