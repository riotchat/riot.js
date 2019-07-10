import { Client } from '../Client';

import { Channel, GroupChannel } from './Channel';
import { User } from './User';

import { Group as IGroup } from '../api/v1/users';
import { Collection } from '..';

export class Group {

	client: Client;

	id: string;
	title: string;
	displayTitle: string;

	channel: GroupChannel;
	createdAt: Date;

	owner: User;
	members: Collection<string, User>;

	constructor(id: string, title: string) {
		this.id = id;
		this.title = title;
	}

	static async from(client: Client, obj: string | IGroup): Promise<Group> {
		if (typeof obj === 'string') {
			let res = await client.fetch('get', `/users/@me/groups/${obj}`);
			let body: IGroup = res.data;

			return this.from(client, body);
		}

		let group = new Group(obj.id, obj.title);
		group.client = client;

		group.channel = await client.fetchChannel(obj.channel.id, obj.channel) as GroupChannel;
		group.channel.group = group;
		group.createdAt = new Date(obj.createdAt);
		group.owner = await client.fetchUser(obj.owner);

		group.members = new Collection();
		for (let i=0;i<obj.members.length;i++) {
			let id = obj.members[i];
			group.members.set(id, await client.fetchUser(id));
		}

		group.displayTitle = group.members.array().map(x => x.username).join(', ');

		return group;
	}

};