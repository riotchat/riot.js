import { GotUrl } from 'got';
import WebSocket from 'ws';
import { defaultsDeep } from 'lodash';

import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';
import get, { ENDPOINT, Options } from './util/get';

import { Channel } from './internal/Channel';
import { User } from './internal/User';
import { Packets } from './api/ws/v1';
import { Message } from './internal/Message';

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

	get(url: GotUrl, opt: Options = {}) {
		console.debug('[fetching ' + url + ']');
		return get(url, defaultsDeep(opt, {
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
			let res = await get('/auth/authenticate', {
				body: {
					email: id,
					password
				}
			});

			let body: IAuth.Authenticate = res.body;

			if (body.do2FA) {
				let token = body.token;
				return async (code: number) => {
					let res = await get('/auth/2fa', {
						body: {
							token,
							code
						}
					});

					let body: IAuth.Authenticate2FA = res.body;
					this.accessToken = body.accessToken;
					this.sync();
				};
			} else {
				this.accessToken = body.accessToken;
				this.sync();
			}
		} else {
			// TOKEN
		}
	}

	private async sync() {
		this.user = await this.fetchUser('@me');

		let dms = await this.get('/users/@me/channels');
		let channels: {id: string, user: string}[] = dms.body;

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