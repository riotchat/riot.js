import { User as IUser, Status, FriendType } from '../api/v1/users';
import { Client } from '../Client';

export class User {

	username: string;
	id: string;
	relation: FriendType;

	status?: Status;
	avatarURL?: string;

	constructor(username: string, id: string) {
		this.username = username;
		this.id = id;
		this.relation = 'unknown';
	}

	static async from(client: Client, id: string) {
		let res = await client.fetch('get', `/users/${id}`);
		let body: IUser = res.data;

		let user = new User(body.username, body.id);
		user.status = body.status;
		user.avatarURL = body.avatarURL;
		user.relation = client.getFriendStatus(user.id);

		return user;
	}

};