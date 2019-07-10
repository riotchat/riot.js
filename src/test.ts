import { Client } from './Client';

let client = new Client();

client.on('connected', async () => {
	console.log('Logged in as: ' + client.user.username);
});

client.on('message', (msg) => {
	console.log(`[MESSAGE] ${msg.content} in ${msg.channel.id} from ${msg.author.id}`);
	if (msg.content == 'do a thing') {
		msg.channel.send('yes');
	}
});

client.on('error', err => console.error(err));

client.login('BHo1wvYp3CF7AOJeiRuvaSaJimCCsMMgLkKQgZf4jczYixNSC2D_NmpK7zfRZH8X')