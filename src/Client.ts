import WebSocket from 'ws';
import { defaultsDeep } from 'lodash';

import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';
import get, { ENDPOINT } from './util/fetch';

import { Channel } from './internal/Channel';
import { User } from './internal/User';
import { Packets } from './api/ws/v1';
import { Message } from './internal/Message';
import { AxiosResponse, AxiosRequestConfig } from 'axios';

interface ClientEvents {
	connected: void,
	message: Message
};

type Login2FA = (code: number) => Promise<void>;

export class Client extends TypedEventEmitter<ClientEvents> {

	private accessToken?: string;
	private ws?: WebSocket;
	
	cacheMessages: boolean = true;
	user: User;

	channels: Map<string, Channel>;
	users: Map<string, User>;

	constructor() {
		super();

		this.channels = new Map();
		this.users = new Map();
	}

	fetch(method: 'get' | 'post', url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
		console.debug('[fetching ' + url + ']');
		return get(method, url, defaultsDeep(opt, {
			headers: {
				Authorization: this.accessToken
			}
		}));
	}

	private async handle(packet: Packets) {
		if (packet.type === 'messageCreate') {
			this.emit('message', await Message.from(this, packet.id, packet.content, packet.channel, packet.author));
		}
	}

	async login(email: string, password: string): Promise<void | Login2FA>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string): Promise<void | Login2FA> {
		this.ws = new WebSocket('ws://' + ENDPOINT + '/ws');
		this.ws.on('message', msg => this.handle(
			JSON.parse(msg as string))
		);

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
					this.accessToken = body.accessToken;
					this.sync();
				};
			} else {
				this.accessToken = body.accessToken;
				this.sync();
			}
		} else {
			this.accessToken = id;
			this.sync();
		}
	}

	private async sync() {
		this.user = await this.fetchUser('@me');

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

};