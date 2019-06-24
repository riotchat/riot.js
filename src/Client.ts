import ky from 'ky';
import { TypedEventEmitter } from '@elderapo/typed-event-emitter';

interface ClientEvents {
	connected: void
};

export class Client extends TypedEventEmitter<ClientEvents> {

	async login(email: string, password: string): Promise<void>;
	async login(token: string): Promise<void>;
	
	async login(id: string, password?: string) {
		if (password) {
			// U/P
		} else {
			// TOKEN
		}
	}

};