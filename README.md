<div align="center">
	<br>
	<br>
	<br>
	<p align="center">
		<a href="https://riotchat.gq/developers/documentation/riot-js">
		<img height="100" src="https://raw.githubusercontent.com/riotchat/assets/master/images/riot.js-light.svg?sanitize=true" alt="Riot.js">
		</a>
	</p>
	<p align="center">A library for interacting with the Riot API, designed after Discord.js</p>
	<br>
	<br>
</div>

## Get Started

To use Riot.js in Node.js or with Webpack, install it with

```bash
npm install --save riot.js
```

or

```bash
yarn add riot.js
```

You can then create a client object and log in using a token from a bot created on the [applications page](https://riotchat.gq/developers/applications).

```javascript
const Riot = require('riot.js');
const client = new Riot.Client();

client.login("bot-token");
```

The library also has Typescript typings.

```typescript
import { Client } from 'riot.js';
const client = new Client();

client.login("bot-token");
```

## Documentation

A full, detailed documentation about Riot.js can be found on our <a href="https://riotchat.gq/developers/documentation/riot-js" target="_blank">developer portal</a>.

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation](https://riotchat.gq/developers/documentation/riot-js).

See [the contribution guide](/CONTRIBUTING.md) if you'd like to submit a pull request.

## Help

If you don't understand something in the documentation, or having issues, please don't hesitate to join our [Riot Developers](https://riot.gg/developers) channel on Riot.

## License

Riot.js is licensed under the [Apache License 2.0](/LICENSE)
