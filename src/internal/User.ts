import { User as IUser, Status } from '../api/v1/users';
import { Client } from '../Client';

export class User {

	username: string;
	id: string;

	status?: Status;
	avatarURL?: string;

	constructor(username: string, id: string) {
		this.username = username;
		this.id = id;
	}

	static async from(client: Client, id: string) {
		let res = await client.get(`/users/${id}`);
		let body: IUser = res.body;

		let user = new User(body.username, id);
		user.status = body.status;
		user.avatarURL = body.avatarURL;

		return user;
	}

};