import { ChannelType, Channel as IChannel } from '../api/v1/channels';
import { Client } from '../Client';
import { User } from './User';

export class Channel {

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

		if (body.type == ChannelType.DM) {
			channel.users = [
				await client.fetchUser(body.users[0]),
				await client.fetchUser(body.users[1])
			];
		}

		return channel;
	}

};