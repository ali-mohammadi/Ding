const mysql = require('mysql');

var db = function () {
    return mysql.createConnection({
        host: 'localhost',
        database: 'nodejs',
        user: 'root',
        password: ''
    });
};

var init = function (req, res) {
    var con = db();
    con.connect(function(err) {
        if (err) throw err;
        console.log("Database connected");

        var sql = [];
        sql['Users'] = "CREATE TABLE users (" +
            "id INT AUTO_INCREMENT PRIMARY KEY, " +
            "phone_number VARCHAR(55) UNIQUE, " +
            "name VARCHAR(55) NOT NULL, " +
            "last_name VARCHAR(55), " +
            "profile_pic BLOB, " +
            "status INT(1) NOT NULL DEFAULT 0, " +
            "register_date DATETIME DEFAULT CURRENT_TIMESTAMP)";

        sql['Credentials'] = "CREATE TABLE credentials (" +
            "user_id INT NOT NULL, " +
            "token VARCHAR(255), " +
            "FOREIGN KEY (user_id) REFERENCES users(id) )";

        sql['Messages'] = "CREATE TABLE messages (" +
            "id INT AUTO_INCREMENT PRIMARY KEY, " +
            "body TEXT, " +
            "status INT(1) NOT NULL DEFAULT 0, " +
            "from_id INT, " +
            "to_id INT, " +
            "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, " +
            "FOREIGN KEY (from_id) REFERENCES users(id), " +
            "FOREIGN KEY (to_id) REFERENCES users(id) )";

        for(let i in sql){
            console.log("Creating " + i + ' table...')
            con.query(sql[i], function (err, result) {
                if (err) console.log("Error occurred while creating " + i + ' table. Error: ' + err)
            });
        }
        console.log("Database successfully initialized!")
    });
    res.end();
};

module.exports = {
    db: db,
    init: init
}