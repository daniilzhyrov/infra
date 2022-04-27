const mongoose = require ('mongoose');
const crypto = require('crypto');

const config = require("../config");

const UserSchema = new mongoose.Schema ({
    login : {type : String, required : true},
    fullname : {type : String, required : true},
    password_hash : {type : String, required : true},
    role : {type : Number, default : 0},
    registeredAt : {type : Date, default : Date.now},
    avaUrl : {type : String, default : "/images/defaultUserImage.jpg"},
    isDisabled : {type : Boolean, default : false},
    telegramId : {type : Number},
    currentOrder : { type : mongoose.Schema.ObjectId, ref: "Order" }
});

const UserModel = mongoose.model('User', UserSchema);

function getHash(string, salt){
    const hash = crypto.createHmac('sha512', salt);
    hash.update(string);
    return hash.digest('hex');
};

const UserRoles = {
    User : 0,
    Waiter : 1, 
    Admin : 2
}

class User {

    constructor(login, fullname, password) {
        this.login = login;
        this.fullname = fullname;
        this.password = password;
    }

    static get UserRoles() {
        return UserRoles;
    }
 
    static getById(id) {
        return UserModel.findById(id);
    }

    static getByLogin(login) {
        return UserModel.findOne({
            login : login
        });
    }

    static getByTelegramId(telegramId) {
        return UserModel.findOne({
            telegramId : telegramId
        });
    }

    static getByLoginAndPass(login, password_hash) {
        return UserModel.findOne({
            login : login,
            password_hash : getHash(password_hash, config.salt)
        });
    }
 
    static getAll() {
        return UserModel.find();
    }

    static getNumberOfRecords(query) {
        if (!query)
            query = "";
        return UserModel.find({login : { "$regex": query, "$options": "i" }}).countDocuments();
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
        return UserModel.find({login : { "$regex": query, "$options": "i" }}).skip((page - 1) * numberOfRecordsOnAPage).limit(numberOfRecordsOnAPage).populate('currentOrder');
    }

    static insert(user) {
        user.password_hash = getHash(user.password, config.salt);
        return new UserModel(user).save();
    }

    static update(id, changes) {
        if (changes.password)
            changes.password_hash = getHash(changes.password, config.salt);
        return UserModel.findByIdAndUpdate(id, changes, {
            useFindAndModify : false
        });
    }

    static getWaiters() {
        return UserModel.find ({
            telegramId : {$gt: 1}
        })
    }

    static deleteById (id) {
        return UserModel.findByIdAndDelete(id)
    }

    static getUserToReturn (user) {
        return {
            id : user._id,
            username : user.login,
            fullname : user.fullname, 
            profilePhotoUrl : user.avaUrl,
            telegramId : user.telegramId,
            registeredAt : user.registeredAt,
            role : user.role,
            currentOrder : user.currentOrder
        }
    }
 };
 
module.exports = User;