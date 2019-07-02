import { User as IUser, Status, FriendType, AddFriend, RemoveFriend, CreateDM } from '../api/v1/users';
import { Client } from '../Client';

export class User {

	client: Client;

	id: string;
	username: string;
	relation: FriendType;

	email?: string;
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
		user.client = client;
		user.email = body.email;
		user.status = body.status;
		user.avatarURL = body.avatarURL;
		user.relation = client.getFriendStatus(user.id);

		return user;
	}

	async addFriend() {
		let res = await this.client.fetch('post', `/users/@me/friends/${this.id}`);
		let body: AddFriend = res.data;

		this.relation = body.status;
	}

	async removeFriend() {
		let res = await this.client.fetch('delete', `/users/@me/friends/${this.id}`);
		let body: RemoveFriend = res.data;

		this.relation = body.status;
	}

	async openDM() {
		let res = await this.client.fetch('post', `/users/@me/channels`, {
			data: {
				recipient: this.id
			}
		});
		let body: CreateDM = res.data;

		return this.client.fetchChannel(body.id);
	}

};