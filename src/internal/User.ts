import { User as IUser, Status, FriendType, AddFriend, RemoveFriend, CreateDM, UpdateUser, Activity, UserActivity } from '../api/v1/api/users';
import { Client } from '../Client';

export class User {

	client: Client;

	id: string;
	username: string;
	relation: FriendType;

	email?: string;

	status: Status;
	activity: UserActivity;
	avatarURL: string;

	constructor(username: string, id: string) {
		this.username = username;
		this.id = id;
		this.relation = 'unknown';
	}

	static async from(client: Client, obj: string | IUser): Promise<User> {
		if (typeof obj === 'string') {
			let res = await client.fetch('get', `/users/${obj}`);
			return this.from(client, res.data);
		}

		let user = new User(obj.username, obj.id);
		user.client = client;
		user.email = obj.email;
		user.status = obj.status;
		user.avatarURL = obj.avatarURL;
		user.activity = obj.activity;
		user.relation = obj.relation;

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

	async setStatus(status: Status) {
		this.status = status as any;

		let res = await this.client.fetch('put', `/users/@me`, {
			data: {
				status
			}
		});
		let body: UpdateUser = res.data;

		this.status = body.status;
		return body.status;
	}

	async setActivity(type: Omit<Activity, 'None'>, custom: string): Promise<UserActivity>;
	async setActivity(type: Activity.None): Promise<UserActivity>;

	async setActivity(type: Activity, custom?: string) {
		let res = await this.client.fetch('put', `/users/@me`, {
			data: {
				activity: {
					type,
					custom
				}
			}
		});
		let body: UpdateUser = res.data;

		this.activity = body.activity;
		return body.activity;
	}

};