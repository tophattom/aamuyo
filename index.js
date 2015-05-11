var hotswap = require('hotswap'),
    fs = require('fs'),

    irc = require('irc'),
    moment = require('moment-timezone'),
    
    commandHandler = require('./command-handler.js'),
    config = require('./config.js');


hotswap.on('swap', function() {
    client.removeListener('message', function() {
        client.addListener('message', messageListener(commandHandler));
    });
});

var client = new irc.Client(
    config.server, 
    config.nick, 
    {
        userName: config.nickName,
        realName: config.realName,
        stripColors: true,
        channels: config.channels
    }
);

client.addListener('motd', function(motd) {
    console.log('connected');
});

client.addListener('message', messageListener(commandHandler));
client.addListener('ctcp-version', function(from, to, message) {
    client.notice(from, 'Aamuyön paimen :d (node.js)');
});

client.addListener('error', function(error) {
    console.error('error: ' + error);
    console.dir(error);
});


function messageListener(handler) {
    return function(from, to, message) {
        var target = to === config.nick ? from : to;
        
        if (message.charAt(0) === '!') {
            var parts = message.split(' '),
                command = parts[0].slice(1),
                params = [];
                
            if (parts.length > 1) {
                params = parts.slice(1);
            }
            
            handler.handleCommand(client, from, target, command, params);
        } else if (message.indexOf(config.nick) === 0) {
            handler.handleHilight(client, from, target, message);
        } else {
            handler.handleNormalMessage(client, from, target, message);
        }
    };
}
