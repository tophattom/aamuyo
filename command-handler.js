var http = require('http'),

	moment = require('moment-timezone'),
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
		callback: commandJoin,
		hide: true
	},
	'say': {
		callback: commandSay,
		hide: true
	}
};

var hilightReplies = {
	'Come at me bro!' : '(╯°□°）╯︵ /(.□. \\)',
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
    var helpString = Object.keys(commands)
		.filter(function(command) {
			return !commands[command].hide;
		})
		.map(function(command) {
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
    sedExp = new RegExp('s\/(.+?)\/(.?|.+?)\/((?:g|i)(?:g|i)?)?'),
	
	urlExp = new RegExp('\s?(https?:\/\/[^\r\n\t\f ]*)'),
	urlLengthLimit = 55,
	
	oneOfUsLimit = 4,
	messageRepeats = 0;

exports.handleNormalMessage = function(client, sender, target, message) {

	try {
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
	} catch (e) {
		console.log("[ERR] invalid regex w/ sed");
	}
    
	// Check if we have reply for the message
	if (Object.keys(randomReplies).indexOf(message) > -1) {
		var reply = randomReplies[message];
		
		if (Math.random() < reply.chance) {
			setTimeout(function() {
				client.say(target, reply.message);
			}, Math.random() * reply.maxDelay);
		}
	} else {	// Check if the message has been repeated
		var repeatMessage = msgHist.slice(-oneOfUsLimit).filter(function(oldMessage) {
			return oldMessage === message;
		}).length === oneOfUsLimit;
		
		if (repeatMessage) {
			if (Math.random() < (0.5 - messageRepeats / 9)) {
				client.say(target, message);
				messageRepeats++;
				
				console.log('One of us...', message);
			}
		} else {
			messageRepeats = 0;
		}
	}
	
	// Check if the message has a long url and shorten it
	var urlMatch = message.match(urlExp);
	if (urlMatch !== null) {
		var url = urlMatch[1];
		
		if (url.length > urlLengthLimit) {
			var result = '';
			
			var req = http.get('http://urly.fi/api/shorten/?url=' + url, function(res) {
				res.on('data', function(data) {
					result += data.toString();
				});
			});
			
			req.on('close', function() {
				client.say(target, 'Lyhennetty\'d: http://urly.fi/' + result);
			});
			
			req.on('error', function(err) {
				console.error(err);
			});
		}
	}
	

    // keep last X messages, which are not like "s/a/b/<gi>"
	if (message.indexOf('s/') !== 0 && message.split('/').length-1 !== 3) {
		if (msgHist.length < 50) {
			msgHist.push(message);
		} else {
			msgHist.shift();
			msgHist.push(message);
		}
	}
};
