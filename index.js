require('dotenv').config()
const express = require('express')
const axios = require('axios').default;
const path = require('path')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')

const session = require('express-session')
// The querystring module provides utilities for parsing and formatting URL query strings 
const querystring = require('querystring')
// generates random string to validate response from spitify to the call we actually gave
const uuidv4 = require('uuid').v4
const TWO_HOURS = 1000 * 60 * 60 * 2 //MAX time for a cookie 
const {
  SESS_NAME = 'sid', //session id
  SESS_SECRET = 'MoodLifter',
  SESS_LIFETIME = TWO_HOURS,
} = process.env

// name of cookie
const stateCookie = 'spotify_auth_state'
const spotify = axios.create({
  baseURL: 'https://accounts.spotify.com/api/',
})
spotify.defaults.headers.common['Authorization'] = 'Basic ' + (Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64'))

spotify.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

let frontEndUri = process.env.FRONTEND_URI || 'http://localhost:3000/'

let redirect_uri = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())
app.use(cookieParser())

const IN_PROD = process.env.NODE_ENV === "production"
// //serve static files from React app
app.use(express.static(path.join(__dirname, 'react-client/build')));
app.use(session({
  genid: (req) => {
    return uuidv4() // use UUIDs for session IDs
  },
  name: SESS_NAME,
  resave: false,
  saveUninitialized: false,
  secret: SESS_SECRET,
  cookie: {
    maxAge: SESS_LIFETIME,
    sameSite: true,
    httpOnly: false,  // this must be false if you want to access the cookie
    secure: IN_PROD
  }
}))
let refresh_token;
  const refreshTokenChecker = (refresh_token) => {
    return spotify.post('token',  querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      redirect_uri
    }))
  }

const redirectUriForTokens = (access_token, refresh_token)=> {
  return (frontEndUri + '?' + querystring.stringify({
    access_token: access_token,
    refresh_token: refresh_token,
  }))
}
app.get('/login', function(req, res) {
  //spotify getting moodLifter authorization
  // 1. check if our session cookie exists, and has a refresh token
  if(req.session.refresh_token){
    refreshTokenChecker(req.session.refresh_token)
    .then((response)=>{
      res.redirect(redirectUriForTokens(response.data.access_token, response.data.refresh_token))
    })
  }else {
    const state = uuidv4(); //generate random string
      req.session.state = state //setting a cookie
      res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
          response_type: 'code',
          client_id: process.env.SPOTIFY_CLIENT_ID,
          scope: 'streaming playlist-read-collaborative user-read-private user-read-email user-read-playback-state user-top-read user-read-currently-playing user-library-read playlist-modify-public playlist-modify-private user-follow-read',
          state: state,
          redirect_uri
        })
      )
  }
})

app.get('/callback', function(req, res) {
  //moodLifter requesting refresh and access tokens after checking state parameter
  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.session.state || null;

  
  if(state === null || state !== storedState){
    return res.redirect(frontEndUri + '?' + querystring.stringify({
      error: 'state_mismatch'
    }))
  }
  spotify.post('token',  querystring.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri
  }))
  .then((response) =>{
    let access_token = response.data.access_token;
    let refresh_token = response.data.refresh_token;
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    const temp = redirectUriForTokens(access_token, refresh_token)
    //get rid of access token for security purposes 
    res.redirect(redirectUriForTokens(access_token, refresh_token))
  })
  .catch((err) =>{
    res.redirect(frontEndUri + '?' + querystring.stringify({
      error: 'invalid_token'
    }));
  })
})



app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  let refresh_token = req.session.refresh_token;
  if (refresh_token){
    refreshTokenChecker(refresh_token)
    .then((resp)=>{
      if(resp.status === 200){
        let access_token = resp.data.access_token;
        res.send({
          'access_token': access_token
        });
      }else {
        res.statusCode = 500 
        res.send({
          'error': 'error debug me'
        })
      }
    })
  }

});

let server = app.listen(process.env.PORT || 3001, 
  function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log('my app is running at http://%s:%s', host, port)
  })