import got, { GotUrl, GotOptions, GotBodyOptions, GotJSONOptions } from 'got';
import { defaultsDeep } from 'lodash';

export const ENDPOINT = '86.11.153.158:3000';
export type Options = Omit<GotJSONOptions, 'json'>;

export default function get(url: GotUrl, opt: Options = {}) {
	return got(url, defaultsDeep(opt, {
		baseUrl: 'http://' + ENDPOINT + '/api/v1',
		json: true
	}));
}