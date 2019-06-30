import { Client } from '../Client';

import { Channel } from './Channel';
import { User } from './User';

import { Message as IMessage } from '../api/v1/channels';

export class Message {

	id: string;
	content: string;

	createdAt: Date;
	updatedAt: Date;

	channel: Channel;
	author: User;

	constructor(id: string, content: string) {
		this.id = id;
		this.content = content;
	}

	static async from(client: Client, data: IMessage) {
		let message = new Message(data.id, data.content);

		message.createdAt = new Date(data.createdAt);
		message.updatedAt = new Date(data.updatedAt);

		message.channel = await client.fetchChannel(data.channel);
		message.author = await client.fetchUser(data.author);

		let msgs = message.channel.messages;
		if (msgs) {
			msgs.set(data.id, message);
		}

		return message;
	}

};