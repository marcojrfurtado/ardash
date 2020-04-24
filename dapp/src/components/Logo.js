import React from 'react'
import { Typography, withStyles } from '@material-ui/core'
import GitHubIcon from '@material-ui/icons/GitHub'

const styles = theme => ({
    logoHolder: {
      position: "absolute",
      width: '4%',
      bottom: theme.spacing(1),
      right: theme.spacing(0),
    },
    logo: {
      fontSize: 33,
      fontFamily: "Impact",
      'writing-mode': 'vertical-rl',
      'text-orientation': 'upright'
    }
  })
  

const Logo = ({classes}) => {
    return (
    <div className={classes.logoHolder}>
        <a href="//github.com/marcojrfurtado/ardash" style={{'textDecoration': 'none', 'color': 'inherit'}}>
            <Typography className={classes.logo}>Ardash<GitHubIcon/></Typography>
        </a>
    </div>
    )
}


export default withStyles(styles)(Logo);