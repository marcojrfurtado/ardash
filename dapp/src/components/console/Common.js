import React from 'react';
import { CircularProgress, 
         Grid, 
         Typography, 
         InputBase,
         IconButton } from '@material-ui/core';
import { Error, PlayArrow } from '@material-ui/icons';

const messageSpacing = 2

function Loading(message) {
    return (
        <Grid container direction="column" spacing={messageSpacing}>
            <Grid item>
                <CircularProgress size={54}/>
            </Grid>
            <Grid item>
                <Typography variant="h4">{message}</Typography>
            </Grid>
        </Grid>
    );
}

function ErrorStatus(message) {
    return (
        <Grid container direction="column" spacing={messageSpacing}>
            <Grid item>
                <Error color="secondary" style={{'fontSize' : '108px'}}/>
            </Grid>
            <Grid item>
                <Typography variant="h4">{message}</Typography>
            </Grid>
        </Grid>
    );
}

const PlayButton = ({play, className}) => {
    return (
        <span className={className}>
            <InputBase
            placeholder="Arweave Transaction Id"
            />
            <IconButton onClick={
                (e) => { 
                    const inputEl = e.currentTarget.previousSibling.firstChild
                    play(inputEl.value) 
                }}  aria-label="search">
                <PlayArrow />
            </IconButton>
        </span>
    )
}


export {
    Loading,
    ErrorStatus,
    PlayButton
}