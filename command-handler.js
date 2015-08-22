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
	},
	'say': {
		callback: commandSay
	}
};

var hilightReplies = {
    'TiTe?' : 'Sovinisteja!!',
    '<3' : '(･ω･`*)♡'
};

var randomReplies = {
    ':d': {
        message: ':d',
        chance: 0.237,
		maxDelay: 5000
    }
};


function commandJoin(client, from, params) {
	if (config.admins.indexOf(from) !== -1) { 
		client.join(params.join(' '));
	}
}

function commandSay(client, from, params) {
	if (config.admins.indexOf(from) !== -1) {
		client.say(params[0], params.slice(1).join(' '));
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
    sedExp = new RegExp('s\/(.+?)\/(.+?)\/((?:g|i)(?:g|i)?)?'),
	oou = 0;

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
    
	//One of us.. one of us.. one of us.. one of us..
	msgHist.reverse(); //there has to be a better way
	for (i=0; i<4; i++) {
		if (message == msgHist[i] && message !== ":d") { // && message not in randomReplies would be better, fix me :D
			oou++;
			if (oou == 3 && Math.random() < 0.8) {
				client.say(target, message);
				console.log("One of us.. " + message + oou);
				oou = -4; //lazy maybe but eh..
				break;
			}
		}
	}
	msgHist.reverse();
	if (oou > 0) {
		oou = 0;
	}

    // keep last X messages, which are not like "s/a/b/<gi>"
	if (message.indexOf('s/') !== 0 && message.split('/').length-1 !== 3) {
		if (msgHist.length < 15) {
			msgHist.push(message);
		} else {
			msgHist.shift();
			msgHist.push(message);
		}
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
