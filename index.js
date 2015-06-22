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
        userName: config.userName,
        realName: config.realName,
        channels: config.channels,
        stripColors: true
    }
);

client.addListener('motd', function(motd) {
    console.log('connected');
});

client.addListener('message', messageListener(commandHandler));

client.addListener('+mode', function(chan, by, mode) {
	if (['v', 'o'].indexOf(mode) !== -1 && Math.random() <= 0.2) {
        client.say(chan, 'ebin :d');
    }
});

client.addListener('ctcp-version', function(from, to, message) {
    client.notice(from, 'Aamuyön paimen :d (node.js)');
	console.log('[ctcp]', from, 'version\'d');
});

client.addListener('error', function(error) {
    console.error('error: ' + error);
    console.dir(error);
});

// Give ops to admins <3
client.addListener('join', function(chan, who, message) {
	if (config.admins.indexOf(who) !== -1) {
		client.send('MODE', chan, '+o', who);
		console.log('[join]', who, 'on', chan, 'oppe\'d');
	}
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
