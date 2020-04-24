import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Grid, Button } from "@material-ui/core"
import { withStyles } from '@material-ui/core/styles';
import { Archive } from '@material-ui/icons';
import styles from '../styles'
import StepItem from './StepItem'
import { Loading, ErrorStatus } from './console/Common'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { getMPDDom, validateMPD, createTransactionSet, getTransactionSetCost, deployTransactionSet } from '../tools/dashUtils'
import Preview from './console/Preview';
import { walletBalance } from '../tools/arweave'

class Dash extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            isReadyForUpload: false,
            transactionSet: null,
            lastZipFile: null
        }
    }

    onUploadAccepted = (acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            return;
        }
        this.parseZipContent(acceptedFiles[0])
    }

    onUploadRejected = () => {
        this.props.updateConsoleContent(ErrorStatus("Zip upload has been rejected. Please ensure this is a valid file."))
    }

    parseZipFromBackend = () => {
        const { segmentedZipContent } = this.props
        this.parseZipContent(segmentedZipContent)
    }

    parseZipContent = async(zipContent) => {
        try {
            const { wallet } = this.props
            var zipFile = new JSZip()
            this.props.updateConsoleContent(Loading("Loading ZIP content..."))
            await zipFile.loadAsync(zipContent)
            const mpd = await getMPDDom(zipFile)
            validateMPD(mpd, zipFile)
            this.props.updateConsoleContent(Loading("Creating transaction set..."))
            const transactionSet = await createTransactionSet(mpd, zipFile, wallet, (status) => {
                this.props.updateConsoleContent(Loading(`Creating transaction set (${status})...`))
            })
            this.setState({
                transactionSet: transactionSet,
                lastZipFile: zipFile
            })
            const balance = await walletBalance(wallet)
            this.props.updateConsoleContent(this.estimatedCostSummaryView(balance))
        } catch (error) {
            console.error(error)
            this.props.updateConsoleContent(ErrorStatus(error.message))
            return
        }
    }

    downloadZip = () => {
        const { lastZipFile } = this.state
        if (!lastZipFile) {
            console.error("Cannot download zip file")
            return
        }
        lastZipFile.generateAsync({type:"blob"}).then(function(content) {
            saveAs(content, "MPD.zip");
        });
    }

    downloadTransactionSummary = async() => {
        const { transactionSet } = this.state
        if (!transactionSet) {
            console.error("Cannot download transactionSet")
            return
        }
        let summary = [
            {
                'file' : 'MPD',
                'transaction' : transactionSet.mpd.transaction.id,
                'succeeded' : !!transactionSet.postResult
            }
        ]

        transactionSet.segments.forEach( (segment) => {
            summary.push(
                {
                    'file' : segment.fileName,
                    'transaction' : segment.transaction.id,
                    'succeeded' : !!segment.postResult
                }
            )
        })
        const jsonSummary = JSON.stringify(summary, null, 2)
        const content = new Blob([jsonSummary], 
                                 {type: "application/json"});
        saveAs(content, "TransactionSummary.json")
    }

    componentDidUpdate(prevProps) {
        if (prevProps.segmentedZipContent !== this.props.segmentedZipContent) {
          this.parseZipFromBackend();
        }
    }

    dashInfo() {
        return (
            <Typography>Drop ZIP with DASH segments</Typography>
        )
    }

    deploy = async() => {
        const { transactionSet } = this.state
        if ( !transactionSet ) {
            return
        }
        const { wallet } = this.props
        this.props.updateConsoleContent(Loading("Deploying transaction set..."))
        const deployedTransactionSet = await deployTransactionSet(transactionSet, wallet, (deployStatus) => {
            this.props.updateConsoleContent(Loading(`Deploying transaction set (${deployStatus})...`))
        });
        this.setState({
            transactionSet: deployedTransactionSet
        })

        this.props.updateConsoleContent(this.transactionResultSummaryView(deployedTransactionSet))
    }

    transactionResultSummaryView = (deployedTransactionSet) => {
        return (
            <Grid container direction="column" spacing={2}>
                { (deployedTransactionSet.postResult) ?
                    (
                    <Grid item container direction="column" spacing={3}>
                        <Grid item>
                            <Typography variant="h3">Your deployment has succeeded</Typography>
                        </Grid>
                        <Grid item>
                            <Typography paragraph>
                                Your root transaction id is <b>{deployedTransactionSet.mpd.transaction.id}</b>
                            </Typography>
                            <Typography component="span">
                                Set of transactions may take several minutes to become available. Once available, you may use the preview : <Preview txid={deployedTransactionSet.mpd.transaction.id} />
                            </Typography>
                        </Grid>    
                    </Grid>
                    ) :
                    (<Grid item>
                        <Typography variant="h3">Unfortunately the deployment has failed</Typography>
                    </Grid>)
                }
                <Grid item container direction="row" spacing={2}>
                    <Grid item>
                        <Button variant="contained" onClick={ () => this.downloadTransactionSummary()}>
                            Download transaction summary
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" onClick={ () => this.downloadZip()}>
                            Download ZIP containing segments
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        )
    }

    estimatedCostSummaryView = (walletBalance) => {
        const { transactionSet } = this.state
        const estimatedCost = getTransactionSetCost(transactionSet)
        return (
            <Grid container direction="column" spacing={4}>
                <Grid item>
                    <Typography variant="h2">Deployment details</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="h4">Estimated cost: {estimatedCost}</Typography>
                    <Typography variant="h4">Number of segments: {transactionSet.segments.length}</Typography>
                </Grid>
                <Grid item>
                    {(walletBalance && walletBalance >= estimatedCost) ?
                    (
                        <Button variant="contained" 
                            onClick={() => this.deploy()}>Deploy (Cannot be undone)</Button>
                    ) :
                    (
                        <Typography color="secondary" variant="h4">Not enough funds</Typography>
                    )}
                </Grid>
            </Grid>
        )
    }

    render() {
        const { classes, wallet } = this.props
        return(
            <StepItem info={this.dashInfo()}
                      icon={<Archive className={classes.stepIcon}/>}
                      onDrop={this.onUploadAccepted} 
                      onDropRejected={this.onUploadRejected} 
                      accept={'.zip'}
                      disabled={!wallet}/>
        )
    }
}

Dash.propTypes = {
    segmentedZipContent: PropTypes.object,
    wallet: PropTypes.object,
    updateConsoleContent: PropTypes.func.isRequired
};

export default withStyles(styles)(Dash);