import { Client } from './Client';

let test = new Client();
test.on('connected', () => {});

test.login("fatalbad@riot.epic", "yeet").then((twoFactor) => {
	if (twoFactor) {
		// continue doing 2FA
		// twoFactor([id]).catch(console.log);
	}
});