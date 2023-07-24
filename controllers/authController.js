const mysql = require('./dbController');
const jwt = require('jsonwebtoken');


var register = function (req, res) {
    var response = new Object();
    var phoneNumber = req.body.phoneNumber;
    var name = req.body.name;
    var lastName = (req.body.lastName) ? req.body.lastName : '';
    var profilePic = (req.body.profilePic) ? req.body.profilePic : '';
    if (!validatePhoneNumber(phoneNumber)) {
        res.status(400);
        response.result = 'Invalid phone number';
        res.send(JSON.stringify(response));
        res.end();
        return;
    }
    if (!name) {
        res.status(400);
        response.result = 'First name is required';
        res.send(JSON.stringify(response));
        res.end();
        return;
    }
    isRegistered(phoneNumber, function (err, result) {
        console.log(result)
        if (result) {
            res.status(409);
            response.result = 'This phone number is already registered';
            res.send(JSON.stringify(response));
            res.end();
        }
        else {
            var con = mysql.db();
            con.connect(function (err) {
                if (err) throw err;
                var values = [[phoneNumber, name, lastName, profilePic]];
                var sql = "INSERT INTO users (phone_number,name,last_name, profile_pic) VALUES ?";
                con.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    if (result) {
                        var response = new Object();
                        res.status(201);
                        response.result = 'Registered successfully';
                        res.send(JSON.stringify(response));
                        res.end();
                    }
                });
            });
        }
    });

};

var login = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    getUserId(phoneNumber, function (err, result) {
        if (result) {
            var con = mysql.db();
            con.connect(function (err) {
                if (err) throw err;
                var user = {
                    id: result,
                    phoneNumber: phoneNumber
                };
                var token = jwt.sign(user, JWTSECRET);
                var values = [[result, token]];
                var sql = "INSERT INTO credentials (user_id,token) VALUES ?";
                isLoggedIn(phoneNumber, function (err, result) {
                    if (!result) {
                        con.query(sql, [values], function (err, result) {
                            if (err) throw err;
                            if (result) {
                                var response = new Object();
                                res.status(201);
                                response.result = token;
                                res.send(JSON.stringify(response));
                                res.end();
                            }
                        });
                    }
                    else {
                        var response = new Object();
                        res.status(201);
                        response.result = token;
                        res.send(JSON.stringify(response));
                        res.end();
                    }
                })
            });
        }
        else {
            var response = new Object();
            res.status(401);
            response.result = 'Login credentials do not match any account';
            res.send(JSON.stringify(response));
            res.end();
        }
    });

};

var logout = function (req, res) {
    if (req.cookies.token !== undefined) {
        res.clearCookie("token");
        res.render('pages/welcome.ejs');
    } else {
        res.render('pages/welcome.ejs');
    }
}

var getUser = function (req, res) {
    if(typeof req.query.id !== 'undefined') {
        var userId = parseInt(req.query.id);
        if (userId.length == 0) return;
        var con = mysql.db();
        con.connect(function (err) {
            if (err) throw err;
            var values = [userId];
            var sql = "SELECT * FROM users WHERE id = ?";
            con.query(sql, values, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    var response = new Object();
                    response.result = result[0];
                    res.status(201);
                    res.send(JSON.stringify(response));
                    res.end();
                }
                else {
                    var response = new Object();
                    response.result = 'user not found';
                    res.status(404);
                    res.send(JSON.stringify(response));
                    res.end();
                }
            })
        })
    }
    else if (typeof req.query.phoneNumber !== 'undefined'){
        var phoneNumber = req.query.phoneNumber;
        if (phoneNumber.length == 0) return;
        var con = mysql.db();
        con.connect(function (err) {
            if (err) throw err;
            var values = [phoneNumber];
            var sql = "SELECT * FROM users WHERE phone_number = ?";
            con.query(sql, values, function (err, result) {
                if (err) throw err;
                if(result.length > 0) {
                    var response = new Object();
                    response.result = result[0]['id'];
                    res.status(201);
                    res.send(JSON.stringify(response));
                    res.end();
                }
                else {
                    var response = new Object();
                    response.result = 'user not found';
                    res.status(404);
                    res.send(JSON.stringify(response));
                    res.end();
                }
            })
        })
    }
};

var userStatus = function (uid, status) {
    uid = parseInt(uid);
    status = parseInt(status);
    if(uid.length == 0 || status.length == 0) return
    var con = mysql.db();
    con.connect(function (err) {
        if (err) throw err;
        var values = [status, uid];
        var sql = "UPDATE users SET status = ? WHERE id = ?";
        con.query(sql, values, function (err, result) {
            if (err) throw err;
        })
    })
};


function isRegistered(phoneNumber, callback) {
    var con = mysql.db();
    con.connect(function (err) {
        if (err) throw err;
        var sql = `SELECT * FROM users WHERE phone_number = "${phoneNumber}"`;
        con.query(sql, function (err, result) {
            if (err) callback(err, null);
            if (result.length > 0) callback(null, true);
            else callback(null, false)
        });
    });
}

function isLoggedIn(phoneNumber, callback) {
    getUserId(phoneNumber, function (err, id) {
        var con = mysql.db();
        con.connect(function (err) {
            if (err) throw err;
            var sql = `SELECT * FROM credentials WHERE user_id = "${id}"`;
            con.query(sql, function (err, result) {
                if (err) callback(err, null);
                if (typeof result !== 'undefined' && result.length > 0) callback(null, true)
                else callback(null, false)
            });
        });
    })
}

function validatePhoneNumber(number) {
    var re = new RegExp('0?9[0-9]{9}');
    return re.test(String(number).toLowerCase());
}

function getUserId(number, callback) {
    var con = mysql.db();
    con.connect(function (err) {
        if (err) throw err;
        var sql = `SELECT id FROM users WHERE phone_number = "${number}"`;
        con.query(sql, function (err, result) {
            if (err) callback(err, null);
            if (result.length > 0) callback(null, result[0].id)
            else callback(null, false)
        });
    });
}

module.exports = {
    register: register,
    login: login,
    logout: logout,
    getUser: getUser,
    userStatus: userStatus
};