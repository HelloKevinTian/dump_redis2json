var redis = require("redis");

var opts = {
    "no_ready_check": false  //proxy or not
};

var client = redis.createClient(6379, '127.0.0.1', opts);

var fs = require("fs");

var async = require("async");

var date = new Date();

// make backup dir
fs.mkdir('./backup/', function(err) {
    if (err) {
        return;
    }
});

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function(err) {
    console.log("Error " + err);
});



// 1:read data from redis to json
// 2:read data from json to redis
// 3:insert data to redis table
var FLAG = 2;

// set backup filename
var tablename = "h_rank_pvp_cheat1";

var jsonfile = "./backup/" + tablename + "_" + date.getFullYear().toString() + 
"_" + (date.getMonth() + 1).toString() + "_" + date.getDate().toString() + ".json";

var outtable = tablename + "_dump";

if (FLAG === 1) {
    //write data from redis to json file
    client.hgetall(tablename, function(err, obj) {
        fs.open(jsonfile, "w", function(err, fd) {
            if (err) throw err;
            var data = JSON.stringify(obj);

            // console.log(obj); //obj
            // console.log(data); //string

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
    // test  insert data  count超过5000时报错： RangeError: Maximum call stack size exceeded

    // var count = 0;
    // async.whilst(
    //     function() {
    //         return count < 5000;
    //     },
    //     function(callback) {
    //         count++;
    //         client.hset(
    //             tablename,
    //             count.toString(),
    //             "{\"channel\":\"000020\",\"version\":\"2.3.0\",\"nickname\":\"\xe6\x9c\xac\xe6\x80\xa7\xe7\x8c\x96\xe7\x8b\x82\",\"device_guid\":\"bb561920-bcb2-11e4-9b58-f9e21b58f9e2\",\"area\":\"\xe5\x9b\x9b\xe5\xb7\x9d\",\"phone_number\":\"18877981200\",\"championship_id\":15,\"car\":\"40\",\"car_lv\":\"15\",\"racer\":\"4\",\"racer_lv\":\"10\",\"strength\":\"840\",\"score\":1155014,\"score_weekly\":25251,\"score_activity\":25251,\"total_race\":6077,\"total_win\":5350,\"blocked\":0,\"upload_last_time\":1427988940917}",
    //             function(err) {
    //                 if (err) throw err;
    //             }
    //         );
    //         callback(null);
    //     },
    //     function(err) {
    //         console.log("insert over...")
    //         if (err) throw err;
    //     }
    // );

    for (var i = 0; i < 10000; i++) {
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
}