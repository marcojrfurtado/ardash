import Arweave from 'arweave/web'

const viewTransactionBaseUrl = "https://viewblock.io/arweave/tx/";

const arweaveInstance = Arweave.init({
    host: 'arweave.net',
    port: 443,           
    protocol: 'https',
    timeout: 90000,
    logging: false,
})

const walletBalance = async(walletObject) => {
    const address = await arweaveInstance.wallets.jwkToAddress(walletObject)
    const winston =  await arweaveInstance.wallets.getBalance(address)
    return await arweaveInstance.ar.winstonToAr(winston)
}

const waitFor = async(millis) => {
    await new Promise(r => setTimeout(r, millis));
}

const postTransactionWithRetries = async(transaction, maxAttempts = 5) => {
    let attempts = 1
    let timeoutMillis = 0
    while (attempts <= maxAttempts) {
        if (timeoutMillis > 0) {
            await waitFor(timeoutMillis)
        }
        timeoutMillis = (timeoutMillis * 2) + 1000

        try {
            const response = await arweaveInstance.transactions.post(transaction)
            if (response.status === 200) {
                return true
            }
            console.error(`Transaction '${transaction.get('id')}' has failed with status ${response.status}.`)
        } catch ( error ) {
            console.error('Error while trying to post AR transaction. '+ error)
        }
        attempts += 1
    }
    console.error(`Failed posting '${transaction.get('id')}' after ${maxAttempts} attempts`)
    return false
}


export{
    arweaveInstance,
    viewTransactionBaseUrl,
    postTransactionWithRetries,
    walletBalance
}