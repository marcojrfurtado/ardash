import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography } from "@material-ui/core"
import { withStyles } from '@material-ui/core/styles';
import styles from '../styles'
import Preview from './console/Preview'
import { PlayButton } from './console/Common'

class Console extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            internalContent: this.defaultContent()
        }
    }

    defaultContent = () => {
        const { classes } = this.props
        return(
            <div className={classes.welcomeWrapper}>
                <Typography variant="h4" style={{'margin' : 10}}>Welcome to Ardash</Typography>
                <Typography paragraph>
                    Store your own videos in the decentralized Arweave permaweb and embed it anywhere. Let the blockchain stream it for you through MPEG-DASH encoding.
                </Typography>
                <Typography paragraph>
                    This project is still in beta, use at your own risk. Please keep in mind that this is a client-side distributed application, entirely contained in this static page, and not a service. Ardash has no server, and no access to your wallet or any content you wish to deploy to the permaweb. It also cannot be used to remove any deployed material. You, as the user, are solely responsible for any content you deploy. For questions regarding content moderation and removal, please refer to <a href="https://www.arweave.org/technology">Arweave technology</a>.
                </Typography>
                <Typography paragraph>
                    Video pre-processing is only available after connecting your own backend instance.
                    Please refer to the <a href="//github.com/marcojrfurtado/ardash">repository</a> usage details, and for access to the source code.
                </Typography>
                <Typography component="span">
                    If you would like to preview deployed videos, and learn how to embed them in your own website, please provide <PlayButton play={this.playPreview} className={classes.formField} />
                </Typography>
                <Typography>
                    Previewing videos relies on Arweave's gateway, which is centralized. Ardash has no control over the gateway, and it is not responsible for its maintainance.
                </Typography>
                <Typography>
                    If you would like to contribute to the project, please check out the <a href="//github.com/marcojrfurtado/ardash">repository</a>.
                </Typography>
            </div>
        )
    }

    playPreview = (transaction) => {
        this.setState({
            internalContent: (
                <Preview txid={transaction}/>
            )
        })
    }

    render() {
        const { classes, content } = this.props
        const { internalContent } = this.state
        return(
            <Paper className={classes.consolePaper}>
                <div className={classes.consoleContentWrapper}>
                    {content || internalContent}
                </div>
            </Paper>
        )
    }
}

Console.propTypes = {
    content: PropTypes.element
};

Console.defaultProps = {
    content: null
}


export default withStyles(styles)(Console);