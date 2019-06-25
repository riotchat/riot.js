import { Client } from './Client';

let test = new Client();
test.on('connected', () => {});

test.login("example.com", "epic").then((twoFactor) => {
	if (twoFactor) {
		// continue doing 2FA
		twoFactor(352798).catch(console.log);
	}
});