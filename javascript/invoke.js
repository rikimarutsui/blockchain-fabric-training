'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
var args = process.argv.slice(2)
var user = args[0]
var command = args[1]
var variables = args.slice(2)
async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);

        console.log(`Wallet path: ${walletPath}`);
        
        // Check to see if we've already enrolled the user.

        const userExists = await wallet.exists(user);
        if (!userExists) {
            console.log('An identity for the user "'+user+'" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet: wallet, identity: user, discovery: { enabled: false } });
        
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('mycc');

        // Submit the specified transaction.
        //console.log(command);
        const result = await contract.submitTransaction(command, ...variables);
        //const result = await contract.submitTransaction("createProduct", "Tempo", "Tissue Paper");
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
