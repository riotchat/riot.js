import { defaultsDeep } from 'lodash';
import WebSocket from 'isomorphic-ws';
import { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';
import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/api/auth';
import * as IUser from './api/v1/api/users';
import get, { ENDPOINT, AllowedMethods } from './util/fetch';

import { Channel } from './internal/Channel';
import { User } from './internal/User';
import { Packets, ClientPackets } from './api/v1/websocket';
import { Message } from './internal/Message';
import Collection from './util/Collection';
import { Group } from './internal/Group';
import { ErrorObject } from './api/v1/errors';

interface ClientEvents {
	connected: void
	reconnected: void
	error: ErrorObject

	message: Message
	messageUpdate: Message

	userUpdate: User
};

type Login2FA = (code: number) => Promise<void>;

interface RiotSocket extends WebSocket {
	sendPacket: (packets: ClientPackets) => void
};

export class Client extends TypedEventEmitter<ClientEvents> {

	private ws: RiotSocket;
	private pingPong: NodeJS.Timeout;
	private retry = 1e3;
	
	cacheMessages: boolean = true;
	accessToken?: string;
	user: User;

	channels: Collection<string, Channel>;
	users: Collection<string, User>;
	groups: Collection<string, Group>;

	constructor() {
		super();

		this.channels = new Collection();
		this.users = new Collection();
		this.groups = new Collection();
	}

	close() {
		if (this.ws) this.ws.close();
		clearInterval(this.pingPong);
	}

	fetch(method: AllowedMethods, url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
		console.debug('[fetch ' + method.toUpperCase() + ' ' + url + ']');
		return new Promise((resolve, reject) => {
			get(method, url, defaultsDeep(opt, {
				headers: {
					Authorization: this.accessToken
				}
			}))
				.then(resolve)
				.catch(err => reject(err));
		});
	}

	private previouslyConnected: boolean;
	private async handle(packet: Packets) {
		switch (packet.type) {
			case 'ping':
				this.ws.sendPacket({
					type: 'pong'
				});
				break;
			case 'authenticated':
				{
					if (this.previouslyConnected) {
						this.emit('reconnected', undefined);
						return;
					}

					this.emit('connected', undefined);
					this.previouslyConnected = true;
				}
				break;
			case 'message':
				{
					let message = await Message.from(this, packet);
					let msgs = message.channel.messages;
					if (packet.nonce && msgs) {
						msgs.delete(packet.nonce);
					}
					this.emit(+message.createdAt === +message.updatedAt ? 'message' : 'messageUpdate', message);
				}
				break;
			case 'userUpdate':
				{
					let user = await this.fetchUser(packet.user);
					user.status = packet.status || user.status;
					if (packet.activity) user.activity = packet.activity;
					user.relation = packet.relation || user.relation;
					user.avatarURL = packet.avatarURL || user.avatarURL;

					this.emit('userUpdate', user);
				}
				break;
		}
	}

	static async register(email: string, username: string, password: string) {
		let req = await get('post', '/auth/create', {
			data: {
				email,
				username,
				password
			}
		});
		let body: IAuth.UserCreation = req.data;

		return body.accessToken;
	}

	async login(email: string, password: string): Promise<void | Login2FA>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string): Promise<void | Login2FA> {
		if (password) {
			let res = await get('post', '/auth/authenticate', {
				data: {
					email: id,
					password
				}
			});

			let body: IAuth.Authenticate = res.data;

			if (body.do2FA) {
				let token = body.token;
				return async (code: number) => {
					let res = await get('post', '/auth/2fa', {
						data: {
							token,
							code
						}
					});

					let body: IAuth.Authenticate2FA = res.data;
					await this.sync(body.accessToken);
				};
			} else {
				await this.sync(body.accessToken);
			}
		} else {
			await this.sync(id);
		}
	}

	private async sync(accessToken?: string) {
		if (accessToken) this.accessToken = accessToken;
		
		try {
			this.user = await this.fetchUser('@me');
			await this.fetchFriends(true);

			let dms = await this.fetch('get', '/users/@me/channels?sync=true');
			for (let i=0;i<dms.data.length;i++) {
				let channel = await Channel.from(this, dms.data[i]);
				this.channels.set(channel.id, channel);
			}

			let groups = await this.fetch('get', '/users/@me/groups?sync=true');
			for (let i=0;i<groups.data.length;i++) {
				let group = await Group.from(this, groups.data[i]);
				this.groups.set(group.id, group);
			}

			this.connect();
		} catch (err) {
			this.emit('error', err);
		}
	}

	private connect() {
		clearInterval(this.pingPong);

		let ws = <RiotSocket> new WebSocket('wss://' + ENDPOINT);
		ws.sendPacket = data => ws.send(JSON.stringify(data));

		ws.onopen = $ => ws.sendPacket({ type: 'authenticate', token: <string> this.accessToken });
		ws.onclose = $ => {
			clearInterval(this.pingPong);
			setTimeout(() => this.connect(), this.retry);
		};

		ws.onmessage = ev => this.handle(
			JSON.parse(ev.data as string)
		);

		this.ws = ws;
		this.pingPong = setInterval(() => {
			ws.sendPacket({
				type: 'ping'
			});
		}, 2000);
	}

	async fetchChannel(id: string, obj?: any) {
		let channel = this.channels.get(id);
		if (channel) return channel;

		channel = await Channel.from(this, obj || id);
		this.channels.set(id, channel);

		return channel;
	}

	async fetchUser(id: string) {
		if (this.user && id == this.user.id) id = '@me';

		let user = this.users.get(id);
		if (user) return user;

		user = await User.from(this, id);
		this.users.set(id, user);

		return user;
	}

	async fetchGroup(id: string) {
		let group = this.groups.get(id);
		if (group) return group;

		group = await Group.from(this, id);
		this.groups.set(id, group);

		return group;
	}

	private async fetchFriends(includeSelf: boolean = false) {
		let req = await this.fetch('get', '/users/@me/friends?sync=true');
		let body: IUser.User[] = req.data;

		let users: User[] = [];
		for (let i=0;i<body.length;i++) {
			users.push(await User.from(this, body[i]));
		}

		users.forEach(user => this.users.set(user.id, user));

		return users;
	}

};