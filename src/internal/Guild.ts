import { Client } from '../Client';

import { GuildChannel } from './Channel';
import { User } from './User';

import { Guild as IGuild, CreateGuild } from '../api/v1/api/guilds';
import { Collection } from '..';

export class Guild {

	client: Client;

	id: string;
	name: string;

	createdAt: Date;
	iconURL: string;
	channels: Collection<string, GuildChannel>;

	owner: string;
	members: Collection<string, User>;

	constructor(id: string, name: string) {
		this.id = id;
		this.name = name;

		this.channels = new Collection();
		this.members = new Collection();
	}

	static async create(client: Client, name: string): Promise<Guild> {
		let res = await client.fetch('post', '/guilds/create', {
			data: {
				name
			}
		});
		let body: CreateGuild = res.data;

		return await Guild.from(client, body.id);
	}

	static async from(client: Client, obj: string | IGuild): Promise<Guild> {
		if (typeof obj === 'string') {
			let res = await client.fetch('get', `/guilds/${obj}`);
			let body: IGuild = res.data;

			return this.from(client, body);
		}

		let guild = new Guild(obj.id, obj.name);
		guild.client = client;

		guild.createdAt = new Date(obj.createdAt);
		guild.iconURL = obj.iconURL;
		guild.owner = obj.owner;

		for (let i=0;i<obj.channels.length;i++) {
			let ch = obj.channels[i];
			guild.channels.set(ch.id, await client.fetchChannel(ch.id, ch, guild) as GuildChannel);
		}

		return guild;
	}

};