import { Client } from './Client';

let client = new Client();

client.on('connected', async () => {
	console.log('Logged in as: ' + client.user.username);

	/*let fatal = await client.fetchUser('01DEHHQXBCF4YSV91K9F1FT4KK');
	try { await fatal.addFriend(); } catch (e) {}
	try { await fatal.removeFriend(); } catch (e) {}*/

	//client.users.forEach((user) => console.log(`${user.username} is ${user.relation}`));

	let channel = client.channels.array()[0];
	if (channel) {
		let msgs = await channel.fetchMessages();
		//msgs[0].edit('yeet');
	}
});

client.on('message', (msg) => {
	console.log(`[MESSAGE] ${msg.content} in ${msg.channel.id} from ${msg.author.id}`);
	if (msg.content == 'do a thing') {
		msg.channel.send('yes');
	}
});

client.on('error', err => console.error(err));

//client.login('fatalbad@riot.epic', 'yeet');
client.login('BHo1wvYp3CF7AOJeiRuvaSaJimCCsMMgLkKQgZf4jczYixNSC2D_NmpK7zfRZH8X');