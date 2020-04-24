import { arweaveInstance, postTransactionWithRetries } from './arweave';
import { chunkArray } from './arrayUtils'

// Number of maximum segments to be handled in parallel
const maxSegmentBlock = 4;

const getMPDFileName = (zip) => {
    const matches = zip.file(/\.mpd$/)
    if (!matches || matches.length === 0) {
        throw Error("MPD file not found")
    }
    return matches[0]
}

const getMPDDom = async(zip) => {
    const parser = new DOMParser()
    const mpdContent = await getMPDFileName(zip).async("string")
    return parser.parseFromString(mpdContent, 'text/xml');
}

const getMPDNamespace = (mpdDom) => {
    return mpdDom.documentElement.attributes["xmlns"].value
}

const iterateOnImmutable = (allSegmentUrls, onEachFn) => {
    const onEachFnResult = []
    var nextSegment = allSegmentUrls.iterateNext();
    while (nextSegment) {
        onEachFnResult.push(onEachFn(nextSegment))
        nextSegment = allSegmentUrls.iterateNext();
    }
    return onEachFnResult
}

const iterateOnSnapshot = (allSegmentUrls, onEachFn) => {
    const onEachFnResult = []
    for ( var i=0 ; i < allSegmentUrls.snapshotLength; i++ )
    {
        onEachFnResult.push(onEachFn(allSegmentUrls.snapshotItem(i)))
    } 
    return onEachFnResult
}

const iterateOn = (mpdDom, elementName, onEachFn, useSnapshots=false) => {
    const ns = getMPDNamespace(mpdDom)
    const iteratorType = (useSnapshots) ? XPathResult.ORDERED_NODE_SNAPSHOT_TYPE : XPathResult.ANY_TYPE
    const allSegmentUrls = mpdDom.evaluate(`//ns:${elementName}`, mpdDom, () => { return ns }, iteratorType, null)
    if (useSnapshots) {
        return iterateOnSnapshot(allSegmentUrls, onEachFn)
    } else {
        return iterateOnImmutable(allSegmentUrls, onEachFn)
    }
}

const iterateOnAllSegments = (mpdDom, onEachFn, useSnapshots=false) => {
    var result = []
    result = result.concat(iterateOn(mpdDom, 'Initialization', onEachFn, useSnapshots))
    result = result.concat(iterateOn(mpdDom, 'SegmentURL', onEachFn, useSnapshots))
    return result
}

const getFilenameAttributeFromSegment = (segment) => {
    return ("sourceURL" in segment.attributes ) ? "sourceURL" : "media"
}

const getSanitizedFilenameFromSegment = (segment) => {
    return segment.attributes[getFilenameAttributeFromSegment(segment)].value.replace('//','/')
}

const validateMPD = (mpdDom, zip) => {
    const validateFileName = (segment) => {
        const fileName = getSanitizedFilenameFromSegment(segment)
        if (!zip.file(fileName)) {
            throw Error(`Could not find file segment ${fileName} referenced by the MPD`)
        }
    }
    iterateOnAllSegments(mpdDom, validateFileName)
}

const createTransactionsFromSegments = async(mpdDom, zip, arweaveWallet) => {
    const allTransactionPromises = iterateOnAllSegments(mpdDom, async(segment) => {
        const fileName = getSanitizedFilenameFromSegment(segment)
        const data = await zip.file(fileName).async("uint8array")
        let transaction = await arweaveInstance.createTransaction({ 
            data,
            last_tx: ""
        }, arweaveWallet)
        const fee = await arweaveInstance.ar.winstonToAr(transaction.reward)
        return {
            'fileName': fileName,
            'transaction': transaction, 
            'fee' : fee
        }
    })
    return await Promise.all(allTransactionPromises)
}

const addTransactionsToMPD = (mpdDom, segmentTransactions) => {
    
    let fileNameToTransaction = {}
    segmentTransactions.forEach( (segmentWithTransaction) => {
        const txid = segmentWithTransaction.transaction.id
        if (txid.length === 0) {
            console.warn(`Transaction corresponding to file ${segmentWithTransaction.fileName} has not been signed yet.`)
        }
        fileNameToTransaction[segmentWithTransaction.fileName] = txid
    })
    
    let mpdDomClone = mpdDom.cloneNode(true)
    iterateOnAllSegments(mpdDomClone, (segment) => { 
        const fileName = getSanitizedFilenameFromSegment(segment)
        segment.attributes[getFilenameAttributeFromSegment(segment)].value = fileNameToTransaction[fileName]
    }, true)

    return mpdDomClone
}

const createTransactionSet = async(mpdDom, zip, arweaveWallet, statusCallback=null) => {
    statusCallback && statusCallback('converting segments into transactions')
    const allSegmentTransactions = await createTransactionsFromSegments(mpdDom, zip, arweaveWallet)
    const mpdDomStr = new XMLSerializer().serializeToString(mpdDom)
    statusCallback && statusCallback('creating MPD transaction')
    let mpdTransaction = await arweaveInstance.createTransaction({ 
        data: mpdDomStr,
        last_tx: ""
    }, arweaveWallet)

    const mpdFee = await arweaveInstance.ar.winstonToAr(mpdTransaction.reward)
    return {
        'mpd' : {
            'fee' : mpdFee,
            'transaction' : mpdTransaction,
            'dom' : mpdDom
        },
        'segments' : allSegmentTransactions
    }
}

const getTransactionSetCost = (transactionSet) => {
    const segmentsCost = transactionSet.segments.reduce( (total, segment) => {
        return total + parseFloat(segment.fee)
    }, 0.)
    return segmentsCost + parseFloat(transactionSet.mpd.fee)
}

const deployTransactionSet = async(transactionSet, arweaveWallet, deployStatusCallback) => {

    transactionSet['postResult'] = undefined

    deployStatusCallback && deployStatusCallback(`posting ${transactionSet.segments.length} segments`)
    
    const segmentChunks = chunkArray(transactionSet.segments, maxSegmentBlock)
    let segmentsWithPostResult = []
    const last_tx = await arweaveInstance.transactions.getTransactionAnchor()

    for (var cix = 0; cix < segmentChunks.length; cix++) {
        
        deployStatusCallback && deployStatusCallback(`posted ${Math.round((cix/segmentChunks.length)*100)}%`)
        const segmentPostPromisesByChunk = segmentChunks[cix].map( async(segment) => {
            segment.transaction.last_tx = last_tx
            await arweaveInstance.transactions.sign(segment.transaction, arweaveWallet)
            segment['postResult'] = await postTransactionWithRetries(segment.transaction)
            return segment
        })
        const segmentsWithPostResultByChunk = await Promise.all(segmentPostPromisesByChunk)

        if ( !segmentsWithPostResultByChunk.every(segment => !!segment.postResult) ) {
            console.error('Failed to deploy at least one of the segments')
            return transactionSet
        }

        segmentsWithPostResult = segmentsWithPostResult.concat(segmentsWithPostResultByChunk)
    }

    deployStatusCallback && deployStatusCallback('adding transactions to MPD')

    const mpdDomWithTransactions = addTransactionsToMPD(transactionSet.mpd.dom, segmentsWithPostResult)
    transactionSet.mpd.transaction = await arweaveInstance.createTransaction({
        data: new XMLSerializer().serializeToString(mpdDomWithTransactions),
        last_tx: last_tx
    }, arweaveWallet)

    deployStatusCallback && deployStatusCallback(`posting MPD`)

    await arweaveInstance.transactions.sign(transactionSet.mpd.transaction, arweaveWallet)
    transactionSet['postResult'] = await postTransactionWithRetries(transactionSet.mpd.transaction)

    return transactionSet
}


export {
    getMPDFileName,
    getMPDDom,
    validateMPD,
    createTransactionSet,
    getTransactionSetCost,
    deployTransactionSet
}