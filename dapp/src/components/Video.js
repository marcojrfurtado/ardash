import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from "@material-ui/core"
import { OndemandVideo } from "@material-ui/icons"
import { withStyles } from '@material-ui/core/styles';
import styles from '../styles'
import StepItem from './StepItem'
import axios from 'axios'
import { backendUrl } from '../constants'
import { ErrorStatus, Loading } from './console/Common'

class Video extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            needsConfirmation: false,
            transaction: null,
            fee: null,
            successfulTransaction: false,
            maxVideoSizeMB: 0,
            backendAvailable: false
        }
    }

    componentDidMount = () => {
        this.fetchUploadSizeInformation()
    }

    fetchUploadSizeInformation = async() => {
        try {
            const response = await axios.get(`${backendUrl}/size`);
            if (response.status === 200) {
                this.setState({
                    backendAvailable: true,
                    maxVideoSizeMB: parseInt(response.data)
                })
            } 
        } catch (error) {
            console.error("Error fetching backend information "+ error);
        }

        if (!this.state.backendAvailable) {
            setTimeout(this.fetchUploadSizeInformation, 4000)
        }
    }

    displayError = (message) => {
        this.props.updateConsoleContent(ErrorStatus(message))
    }

    displayLoading = (message) => {
        this.props.updateConsoleContent(Loading(message))
    }

    onUploadAccepted = async(acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            return;
        }
        this.processVideo(acceptedFiles[0])
    }

    onUploadRejected = () => {
        this.displayError('Upload rejected. File must be valid, and meet the size requirements.')
    }

    handleBackendError = (response) => {
        const message = new TextDecoder().decode(response.data)
        this.displayError(message)
    }

    processVideo = async(videoFile) => {
        this.displayLoading("Uploading video...")
        const videoContent = await videoFile.arrayBuffer();
        try {
            this.displayLoading("Waiting for video to be segmented...")
            const response = await axios.post(backendUrl, videoContent, {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'video/mp4'
                },
                validateStatus: () => {
                    return true
                }
            });
            if (response.status !== 200) {
                this.handleBackendError(response)
            } else {
                this.props.onVideoProcessed(response.data)
            }
        } catch (error) {
            console.error(error);
            this.displayError(error.toString())
        }
    }

    videoInfo() {
        const { maxVideoSizeMB, backendAvailable } = this.state
        let fabInfo
        if (backendAvailable) {
            fabInfo = (
                <Typography>
                    Drop H.264 Video 
                    { (maxVideoSizeMB > 0) && <span> (Max: {maxVideoSizeMB}MB)</span> }
                </Typography>
            )
        } else {
            fabInfo = (
                <Typography>
                    Video upload unavailable
                </Typography>
            )
        }
        return fabInfo
    }

    render() {
        const { classes, disabled, highlighted } = this.props
        const { maxVideoSizeMB, backendAvailable } = this.state
        return(
            <StepItem info={this.videoInfo()}
                      icon={<OndemandVideo className={classes.stepIcon}/>}
                      onDrop={this.onUploadAccepted} 
                      onDropRejected={this.onUploadRejected} 
                      accept={'video/mp4'} 
                      maxSize={ (maxVideoSizeMB > 0 ) ? maxVideoSizeMB * 1024 * 1024 : Infinity}
                      disabled={disabled || !backendAvailable}
                      highlighted={highlighted}>
            </StepItem>
        )
    }
}

Video.propTypes = {
    onVideoProcessed: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    highlighted: PropTypes.bool,
    updateConsoleContent: PropTypes.func.isRequired
};


export default withStyles(styles)(Video);