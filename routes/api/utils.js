const User = require('../../models/user');

class Utils {
    static checkAdmin (req, res, next) {
        if (req.user.role != User.UserRoles.Admin) {
            res.status(403).send({
                message : "You have no right to access this page"
            });
            return;
        }
        next();
    }
}

module.exports = Utils;