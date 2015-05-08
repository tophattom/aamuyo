var irc = require('irc'),
    moment = require('moment-timezone');


var commands = {
    'help': {
        callback: commandHelp
    },
    'yo': {
        callback: commandNight,
        helpString: '[aikavyöhyke]'
    },
    'aika': {
        callback: commandSleepTime,
        helpString: 'herätysaika'
    }
};

var client = new irc.Client(
    'irc.rizon.net', 
    'aamuyo', 
    {
        userName: 'aamuyo',
        realName: 'Aamuyön Ritardi',
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
        
        var callback = commands[command].callback;
        
        if (callback) {
            callback(from, params);
        }
    }
});

client.addListener('error', function(error) {
    console.error('error: ' + error);
    console.dir(error);
});


function commandHelp(target, params) {
    var helpString = Object.keys(commands).map(function(command) {
        return '!' + command + ' ' + (commands[command].helpString || '');
    }).join(' ');
    
    client.say(target, helpString);
}

function commandNight(target, params) {
    var timezone = params[0] || 'Europe/Helsinki',
        now = moment(new Date()).tz(timezone),
        hour = now.hour();
    
    if (hour >= 2 && hour <= 5) {
        client.say(target, 'On Aamuyö');
    } else {
        client.say(target, 'Ei Aamuyö');
    }
}

function commandSleepTime(target, params) {
    if (params.length === 0) {
        return;
    }
    
    
}
