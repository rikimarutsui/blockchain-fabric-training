/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

class FabricClient{
    constructor(){}

    async listUsers(){
        const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        var users = await wallet.list();
        return users;
    }

    async invoke(user, command, variables = []){
        // Create a new file system based wallet for managing identities.
        const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (!userExists) {
            throw('An identity for the user "'+user+'" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet: wallet, identity: user, discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('mycc');

        // Submit the specified transaction.
        console.log("sending the command");
        const result = await contract.submitTransaction(command, ...variables);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.parse(result.toString());
    }

    async query(user, command, variables = []){
        // Create a new file system based wallet for managing identities.
        const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (!userExists) {
            throw('An identity for the user "'+user+'" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet: wallet, identity: user, discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('mycc');

        // Submit the specified transaction.
        console.log("sending the command");
        const result = await contract.evaluateTransaction(command, ...variables);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.parse(result.toString());
    }
}

module.exports = FabricClient;
