import { Client } from '../Client';

import { Channel } from './Channel';
import { User } from './User';

import { Message as IMessage, EditMessage } from '../api/v1/api/channels';

export class Message {

	client: Client;

	id: string;
	content: string;
	real: boolean;

	createdAt: Date;
	updatedAt: Date;

	channel: Channel;
	author: User;

	constructor(id: string, content: string, real: boolean) {
		this.id = id;
		this.content = content;
		this.real = real;
	}

	static async from(client: Client, data: IMessage) {
		let message = new Message(data.id, data.content, true);
		message.client = client;

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

	async edit(content: string) {
		content = content.substring(0, 2000);
		
		let res = await this.client.fetch('post', `/channels/${this.channel.id}/messages/${this.id}`, {
			data: {
				content
			}
		});
		let body: EditMessage = res.data;

		this.content = content;
		this.updatedAt = new Date(body.updatedAt);
	}

};