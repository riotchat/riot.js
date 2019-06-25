import got from 'got';
import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

import * as IAuth from './api/v1/auth';

interface ClientEvents {
	connected: void
};

type Login2FA = (code: number) => Promise<void>;

export class Client extends TypedEventEmitter<ClientEvents> {

	async login(email: string, password: string): Promise<void | Login2FA>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string): Promise<void | Login2FA> {
		if (password) {
			let res = await got('/auth/authenticate', {
				baseUrl: 'http://localhost:25565/api/v1',
				json: true,
				body: {
					email: id,
					password
				}
			});

			let body: IAuth.Authenticate = res.body;

			if (body.do2FA) {
				let token = body.token;
				return async (code: number) => {
					let res = await got('/auth/2fa', {
						baseUrl: 'http://localhost:25565/api/v1',
						json: true,
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