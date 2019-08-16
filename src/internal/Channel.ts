import { ChannelType, Channel as IChannel, SendMessage, GetMessages } from '../api/v1/api/channels';
import { Client } from '../Client';
import { User } from './User';
import { Message } from './Message';
import Collection from '../util/Collection';
import { Group } from './Group';
import { ulid } from 'ulid';
import { Guild } from './Guild';

export class Channel {

	client: Client;
	id: string;

	messages?: Collection<string, Message>;

	static async from(client: Client, obj: string | IChannel, parent?: Group | Guild): Promise<Channel> {
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
		} else if (obj.type === ChannelType.GROUP) {
			channel = (<GroupChannel> channel);
			channel.description = obj.description;
			channel.group = parent as Group || await client.fetchGroup(obj.group);
		} else if (obj.type === ChannelType.GUILD) {
			channel = (<GuildChannel> channel);
			channel.description = obj.description;
			channel.name = obj.name;
			channel.guild = parent as Guild || await client.fetchGuild(obj.guild);
		}

		return channel;
	}

	preload(content: string): string | undefined {
		if (!this.messages) return;

		let nonce = ulid();
		let message = new Message(nonce, content, false);
		message.author = this.client.user;
		message.channel = this;
		message.createdAt = new Date();
		message.updatedAt = message.createdAt;

		this.messages.set(nonce, message);

		return nonce;
	}

	async send(content: string) {
		content = content.substring(0, 2000);
		let nonce = this.preload(content);

		let res = await this.client.fetch('post', `/channels/${this.id}/messages`, {
			data: {
				content,
				nonce
			}
		});
		let body: SendMessage = res.data;

		let message = new Message(body.id, content, true);
		message.author = this.client.user;
		message.channel = this;

		return message;
	}

	async fetchMessages(opts?: {
		before?: string,
		after?: string,
		limit?: number
	}) {
		const params: string[] = [];
		let messages: Message[] = [];

		if (opts) {
			opts.before && params.push('before=' + opts.before);
			opts.after && params.push('after=' + opts.after);
			opts.limit && params.push('limit=' + opts.limit);
		}

		let res = await this.client.fetch('get', `/channels/${this.id}/messages?${params.join('@')}`);
		let body: GetMessages = res.data;

		for (let i=0;i<body.length;i++) {
			let m = body[i];
			messages.push(await Message.from(this.client, m));
		}

		return messages;
	}

};

export class DMChannel extends Channel {

	recipient: User;
	users: [User, User];

};

export class GroupChannel extends Channel {

	description: string;
	group: Group;

};

export class GuildChannel extends Channel {

	description: string;
	guild: Guild;
	name: string;

};