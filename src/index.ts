import { exec as Exec } from 'child_process';
import { promisify } from 'node:util';
import { dns_servers, port } from './config.json';
const default_port = 'Wi-Fi';

const exec = promisify(Exec);

if (!dns_servers?.length) {
	throw Error('You need to have atleast one DNS server in your config file.');
}

async function getDNS(port: string = default_port) {
	const { stdout } = await exec(`networksetup -getdnsservers ${port}`);

	return stdout;
}

async function checkDNS(port: string = default_port) {
	const dns = await getDNS(port);
	const activeDns = dns.split('\n');
	activeDns.pop();

	let checker = (arr: string[], target: string[]) => target.every((v) => arr.includes(v));
	if (checker(activeDns, dns_servers) === true) {
		return 'ON';
	} else if (checker(activeDns, dns_servers) === false) {
		return 'OFF';
	}
}

async function toggleDNS(state: 'ON' | 'OFF', port: string = default_port) {
	switch (state) {
		case 'OFF': {
			const {} = await exec(`networksetup -setdnsservers ${port} ${dns_servers.join(' ')}`).catch(() => {
				throw Error('Something broke whilst trying to set the dns servers.');
			});

			return {
				state: 'SET',
				header: 'DNS servers set successfully',
				servers: dns_servers.join(' - '),
			};
		}
		case 'ON': {
			const {} = await exec(`networksetup -setdnsservers ${port} empty`).catch(() => {
				throw Error('Something broke whilst trying to clear the dns servers.');
			});

			return { state: 'CLEAR', header: 'DNS servers cleared successfully' };
		}
	}
}

async function main(port: string = default_port) {
	const state = await checkDNS(port);
	const response = await toggleDNS(state, port);

	response;

	console.log(
		[
			' ',
			`\x1b[1m\x1b[36m➜ ${
				response.state === 'SET' ? '\x1b[32m' : response.state === 'CLEAR' ? '\x1b[91m' : ''
			}${response.header}`,
			`${response.servers ? `\x1b[36m• Servers: \x1b[0m${response.servers}` : ''}`,
			' ',
		].join('\n')
	);
}

(async () => {
	await main(port);
})();

