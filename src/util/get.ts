import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Url } from 'url';
import { defaultsDeep } from 'lodash';

export const ENDPOINT = '86.11.153.158:3000';
export type Options = Omit<AxiosRequestConfig, 'url'>;

export default function get(url: string, opt: Options = {}): Promise<AxiosResponse> {
	/*return got(url, defaultsDeep(opt, {
		baseUrl: 'http://' + ENDPOINT + '/api/v1',
		json: true
	}));*/

	return axios(url, defaultsDeep(opt, {
		baseURL: 'http://' + ENDPOINT + '/api/v1',
	}));
}