const path = require('path');
const logger = require('morgan');
const express = require('express');
const config = require("./config");
const mongoose = require("mongoose");
const passport = require('passport');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const session = require('express-session');
const mustache = require('mustache-express');
const cookieParser = require('cookie-parser');
const busboyBodyParser = require('busboy-body-parser');

const apiRouter = require('./routes/api/main');
const authRouter = require('./routes/auth');

const User = require('./models/user');
const Restaurant = require('./models/restaurant');

const app = express();

app.engine('mst', mustache());

app.set('view engine', 'mst');
app.use(express.static(path.join(__dirname, 'build')));

app.use(favicon(path.join(__dirname, 'public','images','favicon.ico')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(busboyBodyParser({ 
    limit: '5mb',
}));
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

app.use((req, res, next) => {
    try {
        let render = res.render;
        res.render = async (view, options) => {
            const restaurant = await Restaurant.get();
            if (!options)
                options = {};
            options.restaurant_name = restaurant.name;
            if (req.user) {
                options.authorizedUser = req.user;
                options.authorizedUser.admin = (options.authorizedUser.role == User.UserRoles.Admin);
            }
            render.call(res, view, options);
        };
        next();
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
});

app.use('/auth', authRouter);
app.use('/api/v1', apiRouter);

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

void async function () {
    try {
        await mongoose.connect(config.DatabaseUrl,
                                { useNewUrlParser : true,
                                useUnifiedTopology: true});
        if (mongoose.connection.readyState) {
            console.log(`Database connected`);
            app.listen(config.ServerPort, (err) => {
                if (err)
                    throw err;
                console.log(`Server was started on port ${config.ServerPort}`);
            });
        }
    } catch(err) {
        console.error(err);
    }
} ();
