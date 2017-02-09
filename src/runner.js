#!/usr/bin/env node
var q = require('q'),
    _ = require('lodash'),
    util = require('util'),
    utils = require('./utils'),
    driver = utils.getDriver(),
    C = driver.constants;

driver.connect('runner')
.then(() => driver.queue.create('users', 'read'))
.then(_usersQueue => {

    var usersQueue = _usersQueue;

    function loop() {
        var userId, fetchedUserId;

        driver.config.emit('runnerLoopStage','start');

        usersQueue.fetch()
            .then((_userId) => {
                userId = fetchedUserId = _userId;
                var onlyInRoom;
                var m = userId.match(/^SourceKeeper:(.*)$/);
                if(m) {
                    userId = '3';
                    onlyInRoom = m[1];
                }

                m = userId.match(/^Invader:(.*)$/);
                if(m) {
                    userId = '2';
                    onlyInRoom = m[1];
                }

                return driver.makeRuntime(userId, onlyInRoom);
            })
            .catch((error) => driver.sendConsoleError(userId, _.isObject(error) ? error.error || error.stack : error))
            .then(() => usersQueue.markDone(fetchedUserId))
            .catch((error) => console.error('Error in runner loop:', _.isObject(error) && error.stack || error))
            .finally(() => {
                driver.config.emit('runnerLoopStage','finish', userId);
                setTimeout(loop, 0);
            });
    }

    loop();

}).catch((error) => {
    console.log('Error connecting to driver:', error);
});


if(typeof self == 'undefined') {
    setInterval(() => {
        var rejections = q.getUnhandledReasons();
        rejections.forEach((i) => console.error('Unhandled rejection:', i));
        q.resetUnhandledRejections();
    }, 1000);
}

