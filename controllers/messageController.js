const mysql = require('./dbController');
const auth = require('./authController');
const moment = require('moment');
const util = require('util');

var con = mysql.db();
const queryAsync = util.promisify(con.query).bind(con)

var getList = async (uid) => {
    try {
        var list = [];
        var sql = `SELECT IF(from_id = ${uid}, to_id, from_id) AS user_id, users.name, users.last_name, messages.body, messages.timestamp FROM messages INNER JOIN users ON IF(from_id = ${uid}, to_id, from_id) = users.id WHERE messages.id IN (` +
            ` SELECT MAX(id) AS last_msg_id ` +
            `FROM messages WHERE from_id = ${uid} OR to_id = ${uid} ` +
            `GROUP BY IF(to_id = ${uid}, from_id, to_id)` +
            ") ORDER BY messages.timestamp DESC";
        var items = await queryAsync(sql).catch(e => {
            throw e
        });
        for (const item of items) {
            var temp = {};
            temp.user_id = item.user_id;
            temp.name = item.name;
            if(item.last_name != null) temp.name += ' ' + item.last_name;
            temp.message = item.body;
            if (moment(item.timestamp).isBefore(moment().format("YYYY-MM-DD"))) {
                temp.date = moment(item.timestamp).format("MMM D")
            }
            else {
                temp.date = moment(item.timestamp).format("HH:mm")
            }
            sql = `SELECT COUNT(id) as count FROM messages WHERE from_id = ${item.user_id} AND to_id = ${uid} AND status = 0`;
            var unseen = await queryAsync(sql).catch(e => {
                throw e
            });
            temp.unseen = unseen[0]['count']
            list.push(temp)
        }
    }
    catch (err) {
        console.log(err)
        throw error
    }
    finally {
        return list
        con.close()
    }
};

var get = function (my_id, contact_id, callback) {
    var con = mysql.db();
    con.connect(function (err) {
        if (err) throw err;
        var values = [parseInt(my_id), parseInt(contact_id)];
        var sql = "UPDATE messages SET status = 1 WHERE to_id = ? AND from_id = ?";
        con.query(sql, values);
        var values = [parseInt(my_id), parseInt(contact_id), parseInt(contact_id), parseInt(my_id)]
        var sql = "SELECT * FROM messages WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?) ORDER BY timestamp ASC";
        var messages = [];
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (result) {
                for (const msg of result) {
                    var temp = {};
                    temp.id = msg.id;
                    temp.message = msg.body;
                    temp.date = msg.timestamp;

                    if (msg.from_id != my_id) temp.sender = "contact";
                    else temp.sender = "you";

                    if (msg.status == 0) temp.status = "sent";
                    else temp.status = "seen";
                    messages.push(temp);
                }
                callback(messages);
            }
        })
    });
};

var save = function (from_id, to_id, message, callback) {
    var con = mysql.db();
    con.connect(function (err) {
        if (err) throw err;
        var values = [parseInt(from_id), parseInt(to_id), message.trim()]
        var sql = "INSERT INTO messages (from_id, to_id, body) VALUES (?, ?, ?)";
        con.query(sql, values, function (err, result) {
            if (err) throw err;
            if (result) {
                callback(true);
            }
            else {
                callback(false);
            }
        })
    });
};

module.exports = {
    getList: getList,
    get: get,
    save: save
};