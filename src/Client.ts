import { defaultsDeep } from 'lodash';
import WebSocket from 'isomorphic-ws';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';
import * as IUser from './api/v1/users';
import get from './util/fetch';

import { Channel } from './internal/Channel';
import { User } from './internal/User';
import { Packets, ClientPackets } from './api/ws/v1';
import { Message } from './internal/Message';
import Collection from './util/Collection';

interface ClientEvents {
	connected: void
	error: Error | string

	message: Message
	messageUpdate: Message

	userUpdate: User
};

type Login2FA = (code: number) => Promise<void>;

interface RiotSocket extends WebSocket {
	sendPacket: (packets: ClientPackets) => void
};

export class Client extends TypedEventEmitter<ClientEvents> {

	private ws?: RiotSocket;
	
	cacheMessages: boolean = true;
	accessToken?: string;
	user: User;

	private knownUsers: Collection<string, IUser.FriendType>;
	channels: Collection<string, Channel>;
	users: Collection<string, User>;

	constructor() {
		super();

		this.knownUsers = new Collection();
		this.channels = new Collection();
		this.users = new Collection();
	}

	fetch(method: 'get' | 'post' | 'delete', url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
		console.debug('[fetch ' + method.toUpperCase() + ' ' + url + ']');
		return get(method, url, defaultsDeep(opt, {
			headers: {
				Authorization: this.accessToken
			}
		}));
	}

	private async handle(packet: Packets) {
		switch (packet.type) {
			case 'messageCreate':
				{
					let message = await Message.from(this, packet);
					this.emit(message.createdAt === message.updatedAt ? 'message' : 'messageUpdate', message);
				}
				break;
			case 'userUpdate':
				{
					let user = await this.fetchUser(packet.user);
					user.relation = packet.relation || user.relation;
					user.avatarURL = packet.avatarURL || user.avatarURL;

					this.emit('userUpdate', user);
				}
				break;
		}
	}

	async login(email: string, password: string): Promise<void | Login2FA>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string): Promise<void | Login2FA> {
		try {
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
						this.sync(body.accessToken);
					};
				} else {
					this.sync(body.accessToken);
				}
			} else {
				this.sync(id);
			}
		} catch (e) {
			this.emit('error', e);
		}
	}

	private async sync(accessToken?: string) {
		if (accessToken) this.accessToken = accessToken;

		let ws = <RiotSocket> new WebSocket('ws://' + '86.11.153.158:3000' /*ENDPOINT*/ + '/ws');
		ws.sendPacket = data => ws.send(JSON.stringify(data));
		ws.onopen = $ => ws.sendPacket({ type: 'authenticate', token: <string> this.accessToken });
		ws.onmessage = ev => this.handle(
			JSON.parse(ev.data as string)
		);
		
		this.user = await this.fetchUser('@me');
		await this.fetchFriends();

		let dms = await this.fetch('get', '/users/@me/channels');
		let channels: {id: string, user: string}[] = dms.data;

		for (let i=0;i<channels.length;i++) {
			let raw = channels[i];
			await this.fetchChannel(raw.id);
		}

		this.emit('connected', undefined);
	}

	async fetchChannel(id: string) {
		let channel = this.channels.get(id);
		if (channel) return channel;

		channel = await Channel.from(this, id);
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

	async fetchFriends() {
		let req = await this.fetch('get', '/users/@me/friends');
		let body: IUser.Friends = req.data;

		let users: User[] = [];
		for (let i=0;i<body.length;i++) {
			let entry = body[i];
			this.knownUsers.set(entry.user, entry.type);
			users.push(await this.fetchUser(entry.user));
		}

		return users;
	}

	getFriendStatus(userId: string): IUser.FriendType {
		if (!this.user || userId === this.user.id) {
			return 'self';
		}

		let type = this.knownUsers.get(userId);
		if (type) {
			return type;
		}

		return 'unknown';
	}

};