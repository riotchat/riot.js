import { ChannelType, Channel as IChannel, SendMessage, GetMessages } from '../api/v1/channels';
import { Client } from '../Client';
import { User } from './User';
import { Message } from './Message';
import Collection from '../util/Collection';

export class Channel {

	client: Client;

	type: ChannelType;
	id: string;

	messages?: Collection<string, Message>;

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
		let res = await client.fetch('get', `/channels/${id}`);
		let body: IChannel = res.data;

		let channel = new Channel(body.type, id);
		channel.client = client;

		if (client.cacheMessages) {
			channel.messages = new Collection();			
		}

		if (body.type == ChannelType.DM) {
			channel.users = [
				await client.fetchUser(body.users[0]),
				await client.fetchUser(body.users[1])
			];
		}

		return channel;
	}

	async send(content: string) {
		let res = await this.client.fetch('post', `/channels/${this.id}/messages`, {
			data: {
				content
			}
		});
		let body: SendMessage = res.data;

		let message = new Message(body.id, content);
		message.author = this.client.user;
		message.channel = this;

		return message;
	}

	async fetchMessages() {
		let messages: Message[] = [];

		let res = await this.client.fetch('get', `/channels/${this.id}/messages`);
		let body: GetMessages = res.data;

		for (let i=0;i<body.length;i++) {
			let m = body[i];
			messages.push(await Message.from(this.client, m.id, m.content, m.channel, m.author));
		}

		return messages;
	}

};