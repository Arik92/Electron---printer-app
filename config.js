const config = {
    PRINTER_USER: 'vule',
    PRINTER_PASS: 'ftrdFed5w',
    PRINTER_INTERVAL: '1',
    HOST_STRING: '10a.mongo.evennode.com:27017',
    MONGO_USER: '6ee4666584e02207c9e849fa761720e5',
    MONGO_SHELL: "mongodb://10a.mongo.evennode.com:27017,10b.mongo.evennode.com:27017/6ee4666584e02207c9e849fa761720e5?replicaSet=us-10 -u 6ee4666584e02207c9e849fa761720e5 -p ",
    MONGO_SHELL_SSL: 'mongo --ssl --sslCAFile evennode.pem "mongodb://10a.mongo.evennode.com:27017,10b.mongo.evennode.com:27017/6ee4666584e02207c9e849fa761720e5?replicaSet=us-10" -u 6ee4666584e02207c9e849fa761720e5 -p ',
    INFO_PWD: 'twgA9DTtGNU9Bjp', //old. for f2p access info
    MONGO_PWD: '5fmBZP2KRC6uRxF',
    AUTH_HEADER: 'ObpirxoNy9aosxTZxXEx',
    LOG_API: 'https://factory.doublero.com/api/printers/downloader/log',
    ARTWORK_API: 'https://factory.doublero.com/api/printers/downloader/artwork',
    QUEUE_API: 'https://factory.doublero.com/api/printers/downloader/queue',
    SHORT_ID_API: 'https://tech-factory.doublero.com/api/printers/printid_gen'  
}
module.exports.config = config;