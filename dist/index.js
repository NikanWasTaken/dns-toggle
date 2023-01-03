"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const node_util_1 = require("node:util");
const config_json_1 = require("./config.json");
const exec = (0, node_util_1.promisify)(child_process_1.exec);
if (!config_json_1.dns_servers?.length) {
    throw Error('You need to have atleast one DNS server in your config file.');
}
async function getDNS(port = config_json_1.default_port) {
    const { stdout } = await exec(`networksetup -getdnsservers ${port}`);
    return stdout;
}
async function checkDNS(port = config_json_1.default_port) {
    const dns = await getDNS(port);
    const activeDns = dns.split('\n');
    activeDns.pop();
    let checker = (arr, target) => target.every((v) => arr.includes(v));
    if (checker(activeDns, config_json_1.dns_servers) === true) {
        return 'ON';
    }
    else if (checker(activeDns, config_json_1.dns_servers) === false) {
        return 'OFF';
    }
}
async function toggleDNS(state, port = config_json_1.default_port) {
    switch (state) {
        case 'OFF': {
            const {} = await exec(`networksetup -setdnsservers ${port} ${config_json_1.dns_servers.join(' ')}`).catch(() => {
                throw Error('Something broke whilst trying to set the dns servers.');
            });
            return {
                state: 'SET',
                header: 'DNS servers set successfully',
                servers: config_json_1.dns_servers.join(' - '),
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
async function main(port = config_json_1.default_port) {
    const state = await checkDNS(port);
    const response = await toggleDNS(state, port);
    response;
    console.log([
        ' ',
        `\x1b[1m\x1b[36m➜ ${response.state === 'SET' ? '\x1b[32m' : response.state === 'CLEAR' ? '\x1b[91m' : ''}${response.header}`,
        `${response.servers ? `\x1b[36m• Servers: \x1b[0m${response.servers}` : ''}`,
        ' ',
    ].join('\n'));
}
(async () => {
    await main();
})();
