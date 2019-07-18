import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultsDeep } from 'lodash';
import { ClientError, APIError } from '../api/v1/errors';

export const ENDPOINT = 'api.beta.riotchat.gq';
export type AllowedMethods = 'get' | 'post' | 'put' | 'delete';

export default function get(method: AllowedMethods, url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
	return new Promise((resolve, reject) => {
		axios(url, defaultsDeep(opt, <AxiosRequestConfig> {
			method,
			baseURL: 'https://' + ENDPOINT + '/api/v1'
		}))
		.then(resolve)
		.catch(err => {
			console.log(err.response);
			if (err.response) {
				reject(err.response.data);
			} else {
				reject(ClientError(APIError.CONNECTION_FAILED));
			}
		});
	});
}