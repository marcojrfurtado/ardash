import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core'
import { AccountBalanceWallet } from "@material-ui/icons"
import styles from '../styles'
import { arweaveInstance } from '../tools/arweave'
import StepItem from './StepItem'


class Wallet extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            userArweaveWallet: null,
            userArweaveBalance: null,
            userArweaveWinston: null,
            userArweaveAddress: null
        }
    }

    onAccepted = async (acceptedFiles) => {
        if (acceptedFiles.length < 1) {
            return;
        }
        try{
            const rawContent = await acceptedFiles[0].text()
            const walletObject = await JSON.parse(rawContent)
            const address = await arweaveInstance.wallets.jwkToAddress(walletObject)
            const winston =  await arweaveInstance.wallets.getBalance(address)
            const balance = await arweaveInstance.ar.winstonToAr(winston)
            this.setState({
                userArweaveWallet: walletObject,
                userArweaveBalance: balance,
                userArweaveWinston: winston,
                userArweaveAddress: address,
            })
            this.props.updateAddress(walletObject);
        }catch(error){
            console.error(error)
            this.setState({
                userArweaveWallet: null,
                userArweaveBalance: null,
                userArweaveWinston: null,
                userArweaveAddress: null,
            })
            this.props.updateAddress(null)
            alert('Invalid Wallet File')            
        }
    }

    walletInfo() {
        const { classes } = this.props
        const { userArweaveAddress, userArweaveBalance } = this.state
        return (
            !(userArweaveAddress && userArweaveBalance) ? (
                <Typography className={classes.walletInfo}>Drop AR Wallet</Typography>
            ) : (
                <Grid container direction="column" alignContent="center" justify="center">
                    <Grid item>
                        <Typography noWrap className={classes.walletInfo}>{userArweaveAddress.substr(0,15) + '...'}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography noWrap className={classes.walletInfo}>Balance: {userArweaveBalance}</Typography>
                    </Grid>
                </Grid>
            )
        )
    }

    render() {
        const { classes } = this.props
        const { userArweaveWallet } = this.state
        return(
            <StepItem info={this.walletInfo()} 
                      icon={<AccountBalanceWallet className={classes.stepIcon}/>}
                      accept={'application/json'} 
                      onDrop={this.onAccepted}
                      highlighted={!userArweaveWallet}/>
        )
    }
}

Wallet.propTypes = {
    updateAddress: PropTypes.func.isRequired
};

export default withStyles(styles)(Wallet);