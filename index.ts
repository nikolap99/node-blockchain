import * as crypto from 'crypto';

// Transfer funds from one user to another trough transaction
class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string // public key
  ) {}

  // Convert object to a string to make cryptographic objects easier to deal with
  toString() {
    return JSON.stringify(this);
  }
}

// A block is like a container for multiple transactions(in our case a single transaction to make it simpler)
// You can think of block like an element in an array, or more accurate, a linked list
class Block {
  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string, // reference to a previous block in a chain
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

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
  // Singleton instance
  public static instance = new Chain();

  // A list of blocks
  chain: Block[];

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
  mine(nonce: number) {
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
  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
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

// A wrapper for a public key and a private key
class Wallet {
  public publicKey: string; // For receiving money
  public privateKey: string; // For spending money

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
  sendMoney(amount: number, payeePublicKey: string) {
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
