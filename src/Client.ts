import got from 'got';
import WebSocket from 'ws';

import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';
import get, { ENDPOINT } from './util/get';

interface ClientEvents {
	connected: void
};

type Login2FA = (code: number) => Promise<void>;

export class Client extends TypedEventEmitter<ClientEvents> {

	ws?: WebSocket;

	async login(email: string, password: string): Promise<void | Login2FA>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string): Promise<void | Login2FA> {
		this.ws = new WebSocket('ws://' + ENDPOINT + '/ws');

		this.ws.on('message', (msg) => {
			console.log(msg);
		});

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

					console.log(body);
				};
			} else {
				// logged in
			}
		} else {
			// TOKEN
		}
	}
};