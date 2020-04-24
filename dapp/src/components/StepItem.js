import React from 'react';
import PropTypes from 'prop-types';
import { Fab, Grid } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles';
import Dropzone from './Dropzone'

import styles from '../styles'

class StepItem extends React.Component {

    body = () => {
        const { info, icon } = this.props
        return (
            <Grid container spacing={3}>
                <Grid item xs={6}>
                    {info}
                </Grid>
                <Grid item xs>
                    {icon}
                </Grid>
            </Grid>
        )
    }

    render = () => {
        const { classes , disabled, highlighted} = this.props
        return (
        <Fab className={classes.stepFab} 
             variant="extended"
             disabled={disabled}
             color={(highlighted) ? "primary" : "default"}>
            <Dropzone {...this.props} content={this.body()}></Dropzone>
        </Fab>
        );
    }
}

StepItem.propTypes = {
    info : PropTypes.element.isRequired,
    icon : PropTypes.element.isRequired,
    disabled : PropTypes.bool,
    highlighted : PropTypes.bool
};

StepItem.defaultProps = {
    disabled : false,
    highlighted : false
}

export default withStyles(styles)(StepItem);