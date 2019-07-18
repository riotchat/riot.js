import { ChannelType, Channel as IChannel, SendMessage, GetMessages } from '../api/v1/api/channels';
import { Client } from '../Client';
import { User } from './User';
import { Message } from './Message';
import Collection from '../util/Collection';
import { Group } from './Group';

export class Channel {

	client: Client;
	id: string;

	messages?: Collection<string, Message>;

	static async from(client: Client, obj: string | IChannel): Promise<Channel> {
		if (typeof obj === 'string') {
			let res = await client.fetch('get', `/channels/${obj}`);
			let body: IChannel = res.data;

			return this.from(client, body);
		}

		let channel;
		switch (obj.type) {
			case ChannelType.DM:    channel = new DMChannel(); break;
			case ChannelType.GROUP: channel = new GroupChannel(); break;
			default:				channel = new GuildChannel(); break;
		}

		channel.id = obj.id;
		channel.client = client;

		if (client.cacheMessages) {
			channel.messages = new Collection();			
		}

		if (obj.type === ChannelType.DM) {
			channel = (<DMChannel> channel);
			channel.users = [
				await client.fetchUser(obj.users[0]),
				await client.fetchUser(obj.users[1])
			];
			channel.recipient =
				channel.users[0] === client.user ?
					channel.users[1] : channel.users[0];
		}

		return channel;
	}

	async send(content: string) {
		content = content.substring(0, 2000);

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
			messages.push(await Message.from(this.client, m));
		}

		return messages;
	}

};

export class DMChannel extends Channel {

	description: string;
	recipient: User;
	users: [User, User];

};

export class GroupChannel extends Channel {

	description: string;
	group: Group;

};

export class GuildChannel extends Channel { };