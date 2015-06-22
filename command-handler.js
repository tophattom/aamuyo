var moment = require('moment-timezone'),
	config = require('./config.js');

module.change_code = 1;

var commands = {
    'help': {
        callback: commandHelp
    },
    'yö': {
        callback: commandNight,
        helpString: '[aikavyöhyke]'
    },
    'aika': {
        callback: commandSleepTime,
        helpString: 'herätysaika'
    },
	'join': {
		callback: commandJoin
	}
};

var hilightReplies = {
    'TiTe?' : 'Sovinisteja!!',
    '<3' : '(･ω･`*)♡'
};

var randomReplies = {
    ':d': {
        message: ':d',
        chance: 0.35,
		maxDelay: 5000
    }
};


function commandJoin(client, from, params) {
	if (config.admins.indexOf(from) !== -1) { 
		client.join(params.join(' '));
	}
}


function commandHelp(client, target, params) {
    var helpString = Object.keys(commands).map(function(command) {
        return '!' + command + ' ' + (commands[command].helpString || '');
    }).join('; ');
    
    client.say(target, helpString);
}

function commandNight(client, target, params) {
    var timezone = params[0] || 'Europe/Helsinki',
        now = moment(new Date()).tz(timezone),
        hour = now.hour();
    
    if (hour >= 2 && hour <= 5) {
        client.say(target, 'On Aamuyö');
    } else {
        client.say(target, 'Ei Aamuyö');
    }
}

function commandSleepTime(client, target, params) {
    if (params.length === 0) {
        return;
    }
    
    var wakeUpTime = moment(params[0], ['HH:mm', 'H:mm', 'HH.mm', 'H.mm']).tz('Europe/Helsinki'),
        now = moment(new Date()).tz('Europe/Helsinki'),
        sleepTimes = [];
        
    if (now.isAfter(wakeUpTime)) {
        wakeUpTime.add(1, 'days');
    }
    
    var time = moment(wakeUpTime).tz('Europe/Helsinki').subtract(90, 'minutes');
    
    while (!time.isBefore(now)) {
        sleepTimes.push(time);
        time = moment(time).tz('Europe/Helsinki').subtract(90, 'minutes');
    }
    
    var answer = sleepTimes.reverse().map(function(t) {
        return t.format('HH:mm');
    }).slice(0, 3).join('/');
    
    client.say(target, 'Mene nukkumaan: ' + answer);
}

exports.handleCommand = function(client, sender, target, command, params) {
    var callback = commands[command] ? commands[command].callback : false;
    
    if (callback) {
        callback(client, target, params);
    }
};

exports.handleHilight = function(client, sender, target, message) {
    for (var key in hilightReplies) {
        if (message.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
            client.say(target, sender + ': ' + hilightReplies[key]);
        }
    }

};

// msgHist stores the last X messages passed to handleNormalMessage..
var msgHist = [],
    sedExp = new RegExp('s\/(.+?)\/(.+?)\/((?:g|i)(?:g|i)?)?');

exports.handleNormalMessage = function(client, sender, target, message) {
    var sedMatch = message.match(sedExp);
    if (sedMatch !== null) {
		var r = new RegExp(sedMatch[1], sedMatch[3] || ''),
            w = sedMatch[2];
        
		for (i=msgHist.length-1; i > -1; i--) {
			if (msgHist[i].search(r) !== -1) {
				client.say(target, msgHist[i].replace(r, w));
				break;
			}
		}
	}
    
    // keep last X messages
	if (msgHist.length < 15) {
		msgHist.push(message);
	} else {
		msgHist.shift();
		msgHist.push(message);
	}

    for (var key in randomReplies) {
        var reply = randomReplies[key];
        
        if (message === key) {
            if (Math.random() <= reply.chance) {
				setTimeout(function() {
					client.say(target, reply.message);
				}, Math.random() * reply.maxDelay);
            }
        }
    }
};
