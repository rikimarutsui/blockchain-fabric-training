/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
var args = process.argv.slice(2)
if (args.length < 2){
    console.error("Invalid number of arguments, expecting 2.");
    process.exit(1);
}
var username = args[0]
var role = args[1].toLowerCase();

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (!userExists) {
            console.log(`Identity ${username} does not exist in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: "admin", discovery: { enabled: false } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        var attrs = [{name: "username", value: username, ecert: true}];
        var attr_reqs = [{name: "username", optional: false}];
        switch(role){
            case "creator":
                attrs.push({name: "canCreate", value: "true", ecert: false});
                attr_reqs.push({name: "canCreate", optional: true});
                break;
            default:
                console.error("Unexpected role");
                process.exit(1);
        }
        console.log(attrs);

        const identity = ca.newIdentityService();
        const result = await identity.update(username, { 
            affiliation: 'org1.department1', 
            enrollmentID: username, 
            role: role, 
            attrs:attrs
        }, adminIdentity);
        await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: false } });
        const currentIdentity = gateway.getCurrentIdentity();
        const enrollment = await ca.reenroll(currentIdentity, attr_reqs);
        console.log(result);
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import(username, userIdentity);
        console.log(`Successfully updated user ${username} and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user ${username}: ${error}`);
        process.exit(1);
    }
}

main();
