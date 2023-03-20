import { exec as Exec } from 'child_process';
import { promisify } from 'node:util';
import config from './config.json';
import { createInterface } from 'readline';
const default_port = 'Wi-Fi';

const exec = promisify(Exec);

if (!Object.keys(config).length) {
	throw Error('You need to have atleast one DNS provider in your config file.');
}

// async function getDNS(port: string = default_port) {
// 	const { stdout } = await exec(`networksetup -getdnsservers ${port}`);

// 	return stdout;
// }

async function askProvider(question: string) {
	console.log('\n');
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = new Promise((resolve) =>
		rl.question('\x1b[91m' + question + ' \x1b[1m\x1b[36m:: \x1b[0m', (ans) => {
			rl.close();
			resolve(ans.toLocaleLowerCase());
		})
	);

	// if ((await answer) == 'clear') return await setDNS([], port);
	return answer as Promise<string>;
}

async function askServers(provider: string) {
	if (!Object.keys(config).includes(provider))
		throw Error("This server doesn't exist in the options from the config file.");

	const availableServers: string[] = config[provider];

	console.log('\n\x1b[91m------------------------------------');

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const question = ['\x1b[1m\x1b[36m0 - \x1b[0mapply all ips']
		.concat(
			availableServers.map((ip, index) => {
				return `\x1b[1m\x1b[36m${index + 1} - \x1b[0m${ip}`;
			})
		)
		.concat(['\n', '\x1b[32mType out the number of the one you opt :: ']);

	const answer: Promise<string> = new Promise((resolve) =>
		rl.question(question.join('\n'), (ans) => {
			rl.close();
			resolve(ans.toLocaleLowerCase());
		})
	);

	if (parseInt(await answer) - 1 <= availableServers.length || (await answer) == '0') {
		if ((await answer) == '0') return availableServers;

		return [availableServers[parseInt(await answer) - 1]];
	} else {
		throw Error('You should enter one of the available numbers');
	}

	// switch (server) {
	// 	case 'OFF': {
	// 		const {} = await exec(`networksetup -setdnsservers ${port} ${config.join(' ')}`).catch(() => {
	// 			throw Error('Something broke whilst trying to set the dns servers.');
	// 		});

	// 		return {
	// 			state: 'SET',
	// 			header: 'DNS servers set successfully',
	// 			servers: config.join(' - '),
	// 		};
	// 	}
	// 	case 'ON': {
	// 		const {} = await exec(`networksetup -setdnsservers ${port} empty`).catch(() => {
	// 			throw Error('Something broke whilst trying to clear the dns servers.');
	// 		});

	// 		return { state: 'CLEAR', header: 'DNS servers cleared successfully' };
	// 	}
	// }
}

async function setDNS(ips: string[], port: string = default_port) {
	const {} = await exec(`networksetup -setdnsservers ${port} ${ips.length ? ips.join(' ') : 'empty'}`).catch(() => {
		throw Error('Something broke whilst trying to set the dns servers.');
	});

	return {
		state: ips.length ? 'SET' : 'CLEAR',
		header: ips.length ? 'DNS servers set successfully' : 'DNS servers cleared successfully',
		servers: ips.length ? ips.join(' - ') : null,
	};
}
async function main(port: string = default_port) {
	const provider = await askProvider(
		`Type out the provider you want to use\n\x1b[1m\x1b[36m• Options ・ \x1b[0m${Object.keys(config).join(', ')}`
	);
	let ips = provider == 'clear' ? [] : config[provider].length == 1 ? config[provider] : await askServers(provider);
	console.log('\x1b[91m------------------------------------\x1b[0m');
	const response = await setDNS(ips, port);

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
	await main();
})();

