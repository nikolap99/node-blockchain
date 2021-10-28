"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
// Transfer funds from one user to another trough transaction
class Transaction {
    constructor(amount, payer, // public key
    payee // public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    // Convert object to a string to make cryptographic objects easier to deal with
    toString() {
        return JSON.stringify(this);
    }
}
// A block is like a container for multiple transactions(in our case a single transaction to make it simpler)
// You can think of block like an element in an array, or more accurate, a linked list
class Block {
    constructor(prevHash, // reference to a previous block in a chain
    transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        // Hash the string version of the block
        hash.update(str).end();
        // Return the hash value as a hexadecimal string
        return hash.digest('hex');
    }
}
// A chain is like a linked list of blocks
class Chain {
    constructor() {
        // Define the first block in a chain, which is called *a genesis block*
        // prevHash is empty, since this is the first block with no previous blocks
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }
    // Grab the last block in a chain
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    // Proof of work - Difficult computational problem is solved in order to confirm the block
    // but it's easy to verify that work by multiple other nodes on the system
    // When mining is distributed around the world, it means you have multiple nodes competing to confirm
    // a block on the blockchain and it works like a big lottery - the winner of the lottery earns a portion
    // of the coin as incentive by guessing the nonce right
    mine(nonce) {
        let solution = 1;
        console.log('⛏️ mining...');
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            // Guess until you find a hash that begins with 4 zeros
            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    // Add a new block to the chain after verification
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        // Verify if the transaction is valid
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
// Singleton instance
Chain.instance = new Chain();
// A wrapper for a public key and a private key
class Wallet {
    constructor() {
        // Create a keypair from public and private keys
        // RSA - Encrypt and decrypt data
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    // Send money to another user by specifying the amount and the public key of the user
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        // Signature is like a one-time password
        const signature = sign.sign(this.privateKey);
        // Add a block to the blockchain
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);
console.log(Chain.instance);
