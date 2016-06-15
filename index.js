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

// --- check connection status --
var pinged_at = Date.now(),
	ponged_at = Date.now();

client.addListener('ping', function(server) {
	pinged_at = Date.now();
});

client.addListener('pong', function(server) {
	ponged_at = Date.now();
});

function checkConn() { //have I been pinged lately?
	if (pinged_at < Date.now() - 240000) {
		client.send('PING', config.server);
		setTimeout(checkPonged, 60000); //60s for the server to respond
	}
}

function checkPonged() { //reconnect if no pong's in last 240s
	if (ponged_at < Date.now() - 240000) {
		client.disconnect('Server didn\'t PONG me back');
		setTimeout( function() {client.connect();}, 240000);
	}
}

var checkConnRepeat = setInterval(checkConn, 60*10*1000);
// --- end of check connection status ---

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

// Give ops to admins <3 ..and others.
client.addListener('join', function(chan, who, message) {
	if (config.admins.indexOf(who) !== -1) {
		client.send('MODE', chan, '+o', who);
		console.log('[join]', who, 'on', chan, 'oppe\'d');
	} else if (config.giveOp.indexOf(who) !== -1) {
		client.send('MODE', chan, '+o', who);
		console.log('[join]', who, 'on', chan, 'oppe\'d');
	} else if (config.giveVoice.indexOf(who) !== -1) {
		client.send('MODE', chan, '+v', who);
		console.log('[join]', who, 'on', chan, 'voice\'d');
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
