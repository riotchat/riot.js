import { defaultsDeep } from 'lodash';
import WebSocket from 'isomorphic-ws';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';
import * as IUser from './api/v1/users';
import get, { ENDPOINT } from './util/fetch';

import { Channel } from './internal/Channel';
import { User } from './internal/User';
import { Packets, ClientPackets } from './api/ws/v1';
import { Message } from './internal/Message';
import Collection from './util/Collection';
import { Group } from './internal/Group';

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

	channels: Collection<string, Channel>;
	users: Collection<string, User>;
	groups: Collection<string, Group>;

	constructor() {
		super();

		this.channels = new Collection();
		this.users = new Collection();
	}

	fetch(method: 'get' | 'post' | 'put' | 'delete', url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
		console.debug('[fetch ' + method.toUpperCase() + ' ' + url + ']');
		return get(method, url, defaultsDeep(opt, {
			headers: {
				Authorization: this.accessToken
			}
		}));
	}

	private async handle(packet: Packets) {
		switch (packet.type) {
			case 'authenticated':
				{
					this.emit('connected', undefined);
				}
				break;
			case 'message':
				{
					let message = await Message.from(this, packet);
					this.emit(+message.createdAt === +message.updatedAt ? 'message' : 'messageUpdate', message);
				}
				break;
			case 'userUpdate':
				{
					let user = await this.fetchUser(packet.user);
					user.status = packet.status || user.status;
					user.relation = packet.relation || user.relation;
					user.avatarURL = packet.avatarURL || user.avatarURL;

					this.emit('userUpdate', user);
				}
				break;
		}
	}

	static async register(email: string, username: string, password: string) {

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
						await this.sync(body.accessToken);
					};
				} else {
					await this.sync(body.accessToken);
				}
			} else {
				await this.sync(id);
			}
		} catch (e) {
			this.emit('error', e);
		}
	}

	private async sync(accessToken?: string) {
		if (accessToken) this.accessToken = accessToken;
		
		this.user = await this.fetchUser('@me');
		await this.fetchFriends(true);

		let dms = await this.fetch('get', '/users/@me/channels?sync=true');
		for (let i=0;i<dms.data.length;i++) {
			let channel = await Channel.from(this, dms.data[i]);
			this.channels.set(channel.id, channel);
		}

		let ws = <RiotSocket> new WebSocket('ws://' + ENDPOINT);
		ws.sendPacket = data => ws.send(JSON.stringify(data));
		ws.onopen = $ => ws.sendPacket({ type: 'authenticate', token: <string> this.accessToken });
		ws.onmessage = ev => this.handle(
			JSON.parse(ev.data as string)
		);

		this.ws = ws;
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

	async fetchFriends(includeSelf: boolean = false) {
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