var redis = require("redis");

var opts = {
    "no_ready_check": false //redis用了代理必须改为true
};

var client = redis.createClient(6379, '127.0.0.1', opts);
// var client = redis.createClient(25040, '10.10.2.183', opts); //主干

var fs = require("fs");

var async = require("async");

var date = new Date();

// make backup dir
var cur = './backup/';

if (!fs.existsSync(cur)) {
    fs.mkdirSync(cur, 0755);
}

client.on("error", function(err) {
    console.log("Error " + err);
});

// 1:read data from redis to json
// 2:read data from json to redis
// 3:insert data to redis table
// 4:线上取某时间段的邮件备份
// 5:线上取充值回馈获奖信息
var FLAG = 5;

// set backup filename
var tablename = "h_notice";

var jsonfile = "./backup/" + tablename + "_" + date.getFullYear().toString() +
    "_" + (date.getMonth() + 1).toString() + "_" + date.getDate().toString() + ".json";

var outtable = tablename + "_dump";

if (FLAG === 1) {
    //write data from redis to json file
    client.hgetall(tablename, function(err, obj) {
        fs.open(jsonfile, "w", function(err, fd) {
            if (err) throw err;
            var data = JSON.stringify(obj);

            fs.write(fd, data, 0, 'utf8', function(e) {
                if (e) throw e;
                console.log("write json over...");
                fs.closeSync(fd);
            });
        });
    });

} else if (FLAG === 2) {
    //write data from json to redis
    var content = fs.readFileSync(jsonfile, "utf-8");
    // console.log(content);
    var obj = JSON.parse(content);
    client.hmset(outtable, obj, function(err) {
        if (err) throw err;
        console.log("write redis over...");
    });

} else if (FLAG === 3) {
    for (var i = 0; i < 100000; i++) {
        client.hset(
            tablename,
            i.toString(),
            "{\"channel\":\"000020\",\"version\":\"2.3.0\",\"nickname\":\"\xe6\x9c\xac\xe6\x80\xa7\xe7\x8c\x96\xe7\x8b\x82\",\"device_guid\":\"bb561920-bcb2-11e4-9b58-f9e21b58f9e2\",\"area\":\"\xe5\x9b\x9b\xe5\xb7\x9d\",\"phone_number\":\"18877981200\",\"championship_id\":15,\"car\":\"40\",\"car_lv\":\"15\",\"racer\":\"4\",\"racer_lv\":\"10\",\"strength\":\"840\",\"score\":1155014,\"score_weekly\":25251,\"score_activity\":25251,\"total_race\":6077,\"total_win\":5350,\"blocked\":0,\"upload_last_time\":1427988940917}",
            function(err) {
                if (err) throw err;
            }
        );
    }
    console.log("insert over...");

} else if (FLAG === 4) { //线上取邮件备份
    client.hgetall("h_mail_backup", function(err, reply) {
        fs.open("./backup/mail_3_23_4_6.json", "w", function(err, fd) {
            if (err) throw err;
            var mail_data = [];
            for (var v in reply) {
                var date = new Date(parseInt(v));
                var mail_obj = JSON.parse(reply[v]);
                mail_obj.date = date.toString();
                mail_data.push(mail_obj)
            }

            fs.write(fd, JSON.stringify(mail_data), 0, 'utf8', function(e) {
                if (e) throw e;
                console.log("write json over...");
                fs.closeSync(fd);
            });
        });
    });
} else if (FLAG === 5) { //线上取充值反馈奖
    // "4c030da0-1ddb-11e5-a5ec-5fe565ec5fe5@2015/6/26@2.6.0@000054@Tue Jun 30 2015 17:00:36 GMT+0800 (CST)"
    // "15249265633"

    client.hgetall("h_charge_feedback", function(err, reply) {
        fs.open("./backup/h_charge_feedback_6_26.json", "w", function(err, fd) {
            if (err) throw err;
            var charge_feedback_data = [];
            for (var v in reply) {
                var obj = new Object();
                var arr = v.split('@');
                obj.guid = arr[0];
                obj.activity_time = arr[1];
                obj.version = arr[2];
                obj.channel = arr[3];
                obj.date = arr[4];
                obj.phone_num = reply[v];
                charge_feedback_data.push(obj);
            }

            fs.write(fd, JSON.stringify(charge_feedback_data), 0, 'utf8', function(e) {
                if (e) throw e;
                console.log("write json over...");
                fs.closeSync(fd);
            });
        });
    });
}