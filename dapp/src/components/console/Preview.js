import React from "react";
import PropTypes from 'prop-types';
import { Box, Grid, Typography } from "@material-ui/core"
import { withStyles } from '@material-ui/core/styles';
import styles from '../../styles'
import { PlayButton } from './Common'


class Preview extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            player : window.dashjs.MediaPlayer().create(),
            overrideTxId : null
        }
    }

    componentDidMount = () => {
        const { txid } = this.props
        this.initPlayer(txid)
    }

    overrideTx = (txid) => {
        this.setState({
            overrideTxId : txid
        })
        const { player } = this.state
        player.attachSource(this.arweaveTxUrl(txid))
    }

    initPlayer = (txid) => {
        const { player } = this.state
        player.initialize(document.querySelector("#videoPlayer"), this.arweaveTxUrl(txid), false)
    }

    arweaveTxUrl = (txid) => {
        return "https://arweave.net/"+txid
    }

    render = () => {
        const { classes, txid } = this.props
        const { overrideTxId } = this.state
        const txToPreview = overrideTxId || txid
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item container direction="row" spacing={3}>
                    <Grid item>
                        <div style={{'maxWidth' : '500px'}}>
                            <video id="videoPlayer" style={{'width' : '100%'}} data-dashjs-player controls></video>
                        </div>
                    </Grid>
                    <Grid item>
                        <Typography variant='h4' align={'left'}>Embed code</Typography>
                        <Box className={classes.code} border={1} borderRadius={16}>
                            &lt;script src=&quot;https://cdn.dashjs.org/latest/dash.all.min.js&quot;&gt;&lt;/script&gt;<br/>
                            ...<br/>
                            &lt;body&gt;<br/>
                            &emsp;&lt;div&gt;<br/>
                            &emsp;&emsp;&lt;video data-dashjs-player autoplay<br/>
                            &emsp;&emsp;&emsp;&emsp;src=&quot;{this.arweaveTxUrl(txToPreview)}&quot;<br/>
                            &emsp;&emsp;&emsp;&emsp;controls&gt;&lt;/video&gt;<br/>
                            &emsp;&lt;/div&gt;<br/>
                            &lt;/body&gt;<br/>
                        </Box>
                    </Grid>  
                </Grid>
                <Grid item>
                    <Typography component="span">
                        Try another one? <PlayButton play={this.overrideTx} className={classes.formField} />
                    </Typography>
                </Grid>
            </Grid>
        )
    }
}

Preview.propTypes = {
    txid: PropTypes.string.isRequired
}

export default withStyles(styles)(Preview);