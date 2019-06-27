import { ChannelType, Channel as IChannel, SendMessage } from '../api/v1/channels';
import { Client } from '../Client';
import { User } from './User';
import { Message } from './Message';

export class Channel {

	client: Client;

	type: ChannelType;
	id: string;

	// group + guild
	description?: string;

	// group
	// group: DMGroup;

	// guild
	// guild: Guild;

	// DMs
	users?: [User, User];

	constructor(type: ChannelType, id: string) {
		this.type = type;
		this.id = id;
	}

	static async from(client: Client, id: string) {
		let res = await client.get(`/channels/${id}`);
		let body: IChannel = res.body;

		let channel = new Channel(body.type, id);
		channel.client = client;

		if (body.type == ChannelType.DM) {
			channel.users = [
				await client.fetchUser(body.users[0]),
				await client.fetchUser(body.users[1])
			];
		}

		return channel;
	}

	async send(content: string) {
		let res = await this.client.get(`/channels/${this.id}/messages`, {
			body: {
				content
			}
		});
		let body: SendMessage = res.body;

		let message = new Message(body.id, content);
		message.author = this.client.user;
		message.channel = this;

		return message;
	}

};