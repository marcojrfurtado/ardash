import React from 'react';
import { Grid } from "@material-ui/core"
import { withStyles } from '@material-ui/core/styles';

import styles from './styles'
import Video from './components/Video'
import Wallet from './components/Wallet'
import Dash from './components/Dash'
import Console from './components/Console'




class App extends React.Component {

  constructor(props){
    super(props)
    this.state = {
        userArweaveWallet: null,
        zipContent: null,
        consoleContent: null
    }
  }

  onUpdateWalletAddress = (newUserArweaveWallet) => {
    this.setState({
      userArweaveWallet: newUserArweaveWallet
    });
  };

  onVideoProcessed = (newZipContent) => {
    this.setState({
      zipContent: newZipContent
    });
  }

  onUpdateConsoleContent = (newContent) => {
    this.setState({
      consoleContent: newContent
    })
  }


  render() {
    const { zipContent, userArweaveWallet, consoleContent } = this.state
    const { classes } = this.props
    return (
      <div className={classes.app}>
        <Grid container spacing={3} direction="row" className={classes.toolBar}>
          <Grid item xs>
            <Wallet updateAddress={ this.onUpdateWalletAddress }></Wallet>
          </Grid>
          <Grid item xs>
            <Video onVideoProcessed={ this.onVideoProcessed } 
                   disabled={!userArweaveWallet}
                   updateConsoleContent={ (videoContent) => this.onUpdateConsoleContent(videoContent) }></Video>
          </Grid>
          <Grid item xs>
            <Dash segmentedZipContent={zipContent} 
                  wallet={userArweaveWallet}
                  updateConsoleContent={ (dashContent) => this.onUpdateConsoleContent(dashContent) }></Dash>
          </Grid>
        </Grid>
        <Console content={consoleContent}/>
      </div>
    );
  }
}

export default withStyles(styles)(App);
