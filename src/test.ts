import { Client } from './Client';

let client = new Client();

client.on('connected', () => console.log('Logged in as: ' + client.user.username));

client.on('message', (msg) => {
	console.log(`[MESSAGE] ${msg.content} in ${msg.channel.id} from ${msg.author.id}`);
	if (msg.content == 'do a thing') {
		msg.channel.send('yes');
	}
});

client.login('fatalbad@riot.epic', 'yeet');