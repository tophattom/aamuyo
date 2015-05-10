var moment = require('moment-timezone');

module.change_code = 1;

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

var hilightReplies = {
    'Morkku' : ':d',
    '<3' : '(･ω･`*)♡'
};

var randomReplies = {
    ':d': {
        message: ':d',
        chance: 0.35
    }
};



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

exports.handleCommand = function(client, target, command, params) {
    var callback = commands[command].callback;
    
    if (callback) {
        callback(client, target, params);
    }
};

exports.handleHilight = function(client, target, message) {
    for (var key in hilightReplies) {
        if (message.toLowerCase().indexOf(key.toLowerCase()) !== -1) {
            client.say(target, hilightReplies[key]);
        }
    }

};

// msgHist stores the last 3 messages passed to handleNormalMessage..
var msgHist = [];
exports.handleNormalMessage = function(client, target, message) {
	// sed-like substitute.. I should, maybe?, add the nick of the
	// original sender too, tho, or not, hmm.
	if (message.slice(0,2) === 's/' && message.slice(-1) === '/') {
		r = message.split('/')[1];
		w = message.split('/')[2];
		msgHist.forEach(function(msg) {

			if (msg.indexOf(r) !== -1) {
				client.say(target, msg.replace(r,w));
			}
		})
	} // keep last 3 messages
	if (msgHist.lenght < 3) {
		msgHist.push(message);
	} else {
		msgHist.shift();
		msgHist.push(message);
	}

    for (var key in randomReplies) {
        var reply = randomReplies[key];
        
        if (message === key) {
            if (Math.random() <= reply.chance) {
                client.say(target, reply.message);
            }
        }
    }
};
