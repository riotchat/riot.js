import { Client } from './Client';
import { Activity } from './api/v1/api/users';

let client = new Client();

client.on('connected', async () => {
	console.log('Logged in as: ' + client.user.username);
});

client.on('reconnected', async () => {
	console.log('Reconnected to RIOT after websocket was lost');
});

client.on('message', (msg) => {
	console.log(`[MESSAGE] ${msg.content} in ${msg.channel.id} from ${msg.author.id}`);
	if (msg.content == 'do a thing') {
		setTimeout(() => msg.channel.send('yes'), 1000);
	}
});

client.on('error', err => console.error(err));

client.login('BHo1wvYp3CF7AOJeiRuvaSaJimCCsMMgLkKQgZf4jczYixNSC2D_NmpK7zfRZH8X')