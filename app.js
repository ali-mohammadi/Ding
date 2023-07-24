global.JWTSECRET = 'secret'

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const jwt = require('jsonwebtoken');
const auth = require('./controllers/authController');
const message = require('./controllers/messageController');
const db = require('./controllers/dbController');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser());

app.get('/', function (req, res) {
    if(req.cookies.token == undefined) {
        res.render('pages/welcome.ejs');
    }
    else {
        res.redirect('/dashboard?token=' + req.cookies.token);
    }
});

app.get('/dashboard', function (req, res) {
    if(req.cookies.token == undefined) {
        res.cookie('token', req.query.token, {expires: false});
    }
    jwt.verify(req.query.token, 'secret', function (err, decoded) {
        message.getList(decoded.id).then(list => {
            res.render('pages/dashboard.ejs', {list: list, token: req.query.token});
        })
    });
});

app.get('/install', db.init);

app.post('/register', auth.register);

app.post('/login', auth.login);

app.get('/logout', auth.logout);

app.get('/user', auth.getUser);


var clients = [];
io.sockets.on('connection', function (socket) {
    socket.on('user/token', function (token) {
        jwt.verify(token, 'secret', function (err, decoded) {
            socket.uid = decoded.id;
            clients[socket.uid] = socket.id;
            socket.emit('status', 'Updating');
            socket.broadcast.emit('user/status', '{"user_id": ' + socket.uid + ', "status": "Online"}');
            auth.userStatus(socket.uid, 1);
        });
    });

    socket.on('message/list', function () {
        message.getList(socket.uid).then(list => {
            socket.emit('message/list', list);
            socket.emit('status', 'Ding');
        });
    });

    socket.on('message/send', function (data) {
        data = JSON.parse(data);
        message.save(socket.uid, data.to_id, data.message, function (result) {
            if (result) {
                message.getList(socket.uid).then(list => {
                    socket.emit('message/list', list)
                });
                socket.emit('message/send', 'Success');

                socket.broadcast.to(clients[data.to_id]).emit('message/message', '{"user_id": ' + socket.uid + ', "message": "' + data.message + '"}');
                message.getList(data.to_id).then(list => {
                    socket.broadcast.to(clients[data.to_id]).emit('message/list', list)
                });
            }
            else {
                socket.emit('message/send', 'Failed');
            }
        });
    });
    socket.on('message/get', function (data) {
        data = JSON.parse(data);
        message.get(socket.uid, data.user_id, function (messages) {
            socket.emit('message/get', JSON.stringify(messages))
            message.getList(socket.uid).then(list => {
                socket.emit('message/list', list)
            });
        })
    });

    socket.on('disconnect', function (data) {
        delete clients[socket.uid];
        auth.userStatus(socket.uid, 0);
        socket.broadcast.emit('user/status', '{"user_id": ' + socket.uid + ', "status": "Offline"}');
    });
});

const server = http.listen(3000, function () {
    console.log('listening on *:3000');
});