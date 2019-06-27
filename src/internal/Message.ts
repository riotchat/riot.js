import { Client } from '../Client';

import { Channel } from './Channel';
import { User } from './User';

export class Message {

	id: string;
	content: string;

	channel: Channel;
	author: User;

	constructor(id: string, content: string) {
		this.id = id;
		this.content = content;
	}

	static async from(client: Client, id: string, content: string, channel: string, user: string) {
		let message = new Message(id, content);
		message.channel = await client.fetchChannel(channel);
		message.author = await client.fetchUser(user);
		return message;
	}

};