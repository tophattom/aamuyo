var hotswap = require('hotswap'),
    fs = require('fs'),

    irc = require('irc'),
    moment = require('moment-timezone'),
    
    commandHandler = require('./command-handler.js'),
    config = require('./config.js');


hotswap.on('swap', function() {
    client.removeListener('message', function() {
        client.addListener('message', function(from, to, message) {
            if (message.charAt(0) === '!') {
                var parts = message.split(' '),
                    command = parts[0].slice(1),
                    params = [];
                    
                if (parts.length > 1) {
                    params = parts.slice(1);
                }
                
                commandHandler.handleCommand(client, from, command, params);
            }
        });
    });
});

var client = new irc.Client(
    config.server, 
    config.nick, 
    {
        userName: config.nickName,
        realName: config.realName,
        stripColors: true
    }
);

client.addListener('motd', function(motd) {
    console.log('connected');
});

client.addListener('message', function(from, to, message) {
    if (message.charAt(0) === '!') {
        var parts = message.split(' '),
            command = parts[0].slice(1),
            params = [];
            
        if (parts.length > 1) {
            params = parts.slice(1);
        }
        
        commandHandler.handleCommand(client, from, command, params);
    }
});

client.addListener('error', function(error) {
    console.error('error: ' + error);
    console.dir(error);
});

