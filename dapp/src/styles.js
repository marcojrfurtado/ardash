const styles = theme => ({
    app: {
      'text-align': 'center',
      'margin' : 'auto',
      'width' : '90%'
    },
    toolBar: {
      'margin-bottom' : 20
    },
    stepFab: {
      'height' : 150,
      'width' : 400
    },
    stepIcon: {
      'fontSize' : 48
    },
    consolePaper: {
      'height': '70vh', 
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'center'
    },
    code: {
      'text-align' : 'left',
      'width' : 'max-content',
      'padding' : 5,
      'background-color' : '#ededed'
    },
    formField: {
      'text-align' : 'center',
      'width' : 'max-content',
      'padding' : 10,
      'background-color' : '#ededed',
      'border-radius': '15px',
      'white-space': 'nowrap'
    },
    welcomeWrapper: {
      'width' : '70%',
      'margin' : 'auto'
    },
    logoHolder: {
      position: "static",
      width: '10%',
      bottom: theme.spacing(0.5),
      right: theme.spacing(0)
    },
    logo: {
      left: '50%',
      top: '50%',
      margin: '0 auto',
      fontSize: 48,
      fontFamily: "Impact",
      'writing-mode': 'vertical-rl',
      'text-orientation': 'upright'
    }
  })
  
  export default styles