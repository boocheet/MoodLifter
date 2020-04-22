import React, {Component} from 'react';
import Login from './login/Login'
import Logo from './logo/Logo'
import Feeling from './moods/Feeling'
import {fetchAudioFeatures, usersTopArtistsOrSongs, fetchUser, transferPlaybackToMoodLifter} from './helpers/api-fetcher'
import Header from './header/Header'
import './App.css'

// A Spotify URI is a link that you can find in the Share menu of any track, album, or artist page on Spotify. When a user clicks a link that consists of a Spotify URI (rather than an URL/HTTP address), they're taken directly to the Spotify application, without having to go through the web page first.
// import logo from './logo.svg';

class App extends Component {
  constructor(props) {
    super(props);
    //set the initial state
    this.state = {
      userInfo: {},
      refresh_token: null,
      token: null,
      usersTopArtists: [],
      usersTopSongs: [],
      loggedIn: false,
      playing: false,
      deviceId: '',
      songName: 'track Name',
      artistName: 'Artist Name',
      position: 0,
      duration: 0,
      backgroundImage: ''
    };
    //repeatedly check to see if SDK is ready
    this.spotifyPlayerCheckInterval = null; 
  }
  
  //when we sign into spotify
  componentDidMount() {
    // Set token
    const queryString = window.location.search
    //parse the query string's parameters
    const urlParams = new URLSearchParams(queryString)
    const access_token = urlParams.get('access_token')
    const refresh_token = urlParams.get('refresh_token')
    // console.log('we have a token', access_token, '\nrefresh token', refresh_token)
    if (access_token) {
      // Set token, loggedIn variable
      this.setState({
        token: access_token,
        refresh_token: refresh_token,
        loggedIn: true
      });
      
      //checking every second for spotifies SDK player window.Spotify variable
      this.spotifyPlayerCheckInterval = setInterval(() => this.checkingForSpotifyURI())
    // //user info
    fetchUser(access_token).then((userInfo) => {
      // console.log(userInfo)
      this.setState({userInfo})
    })
    usersTopArtistsOrSongs(access_token, 'tracks').then((data) => {
      // console.log('artist info', data)
      let allArtists = []
      let artistsInfo = []
      let trackInfo = []
        for(let artist of data.items){
          // console.log(artist)
          trackInfo.push({
            'name': artist['name'], 
            'track_uri': artist['uri'], 
            'track_id': artist['id']
          })
          for (let artist_info of artist['artists']){
            if ( !allArtists.includes(artist_info['name'])){
              allArtists.push(artist_info['name'])
              artistsInfo.push({'name': artist_info['name'], 'artistUri' : artist_info['uri']})
          }
        }
      }
      // console.log('all Artist', artistsInfo)
      this.setState({
        usersTopArtists:artistsInfo,
        usersTopSongs: trackInfo
      })
    })
    // usersTopArtistsOrSongs(access_token, 'artists').then((topArtists) => this.setState({usersTopArtists:topArtists}))
  }
}

sadClick (){
  // const {usersTopSongs, token} = this.state
  this.state.usersTopSongs.filter((song) => {
    let  sadSongs = []; 
    fetchAudioFeatures(this.state.token, song.track_id).then(audio => {
      let mood = audio.valence
      if(mood <= 0.33){
        sadSongs.push(song)
      }
      // console.log(audio)
    })
    return sadSongs;
  })
 

}
 //player recieved an update from player
 onStateChange(state) {
  // console.log('onStateChange line 72 state=', state)

  if(state !== undefined){
    const {
      current_track
    } = state.track_window; 
    const songName = current_track.name; 
    const position = current_track.position;
    const duration = current_track.duration;
    const artistName = current_track.artists.map(artist => artist.name).join(',');
    const playing = !state.paused; 
    const backgroundImage = current_track.album.images[0].url;


    this.setState({
      position,
      duration,
      songName,
      artistName,
      playing,
      backgroundImage: backgroundImage
    });
  }
}

spotifyApiEventHandlers(){
  // Error handling
 this.spotifyPlayer.addListener('initialization_error', message => { console.error('Failed to initialize', message)})
 this.spotifyPlayer.addListener('authentication_error', message => {
   console.error('Failed to authenticate', message);
   this.setState({loggedIn: false});
 });
 this.spotifyPlayer.addListener('account_error', e => { console.error(e)})
 this.spotifyPlayer.addListener('playback_error', e => { console.error(e)})

 //playback status updates
 this.spotifyPlayer.addListener('player_state_changed', state => this.onStateChange(state))

 // ready
 this.spotifyPlayer.addListener('ready', data => {
   let {device_id} = data;
  //  console.log('let the music play on!', data)
    // swap music playback to moodLifter
    transferPlaybackToMoodLifter(device_id, this.state.token);
    // fetchAudioFeatures(this.state)
  // console.log(this.spotifyPlayer)
    this.setState({ deviceId: device_id });
  //  console.log('getting spotifyPlayer data .then', this.state.deviceId)
 })
}

onPrevClick() {
  this.spotifyPlayer.previousTrack();
}

onPlayClick() {
  this.spotifyPlayer.togglePlay();
}

onNextClick() {
  this.spotifyPlayer.nextTrack();
}

checkingForSpotifyURI(){
  const {token} = this.state;
  //global variable Spotify is public index.html file however to access the global variable have to use window.Spotify
  if(window.Spotify !== undefined){
    //cancel the interval
    clearInterval(this.spotifyPlayerCheckInterval);
    
    this.spotifyPlayer = new window.Spotify.Player({
      name: 'Mood Lifter Spotify Player',
      getOAuthToken: cb => { cb(token) },
      volume: 0.5
    })
    
    //set up the spotify uri event handlers
    this.spotifyApiEventHandlers();
    //finally, connect!
    this.spotifyPlayer.connect();
  }
}


// componentDidUpdate(prevProps, prevState) {
  // const {usersTopSongs, token} = this.state
//   sad< .33
//   angry > .33 <= .66
//   happy > .66
// }
  // if(prevState.usersTopArtists !== this.state.usersTopArtists){
  //   let angrySongs = [],
  //       happySongs = [], 
  //       sadSongs = []; 
  //   for (let song of usersTopSongs){
  //     // console.log(song)
  //     fetchAudioFeatures(token, song.track_id).then(audio => {
  //       let mood = audio.valence
  //       if(mood <= 0.33){
  //         sadSongs.push(song)
  //       } else if(mood > .33 && mood <= .66){
  //         angrySongs.push(song)
  //       } else {
  //         happySongs.push(song)
  //       }
  //       // console.log(audio)
  //     })
  //   }
  //   this.setState({
  //     angrySongs,
  //     happySongs,
  //     sadSongs
  //   })
  //   console.log(happySongs)
  //   // console.log('prevState', prevState, 'top artist', this.state.usersTopArtists, 'top songs', this.state.usersTopSongs)
    
  // }

// }

  render() {
    // console.log(this.state)
    const {
      userInfo,
      loggedIn,
      artistName,
      songName,
      playing,
      backgroundImage,
      usersTopArtists,
      usersTopSongs
    } = this.state;
 

    return (
      <div className="App">
        {loggedIn ? <Header user={userInfo} /> : <Logo />}
        {/* <Logo /> */}
        {loggedIn ? 
          (<div className="main-wrapper">
            <div className="now-playing__img">
              <img alt={backgroundImage} src={backgroundImage} />
            </div>
            <div className="now-playing__side">
              <div className="now-playing__name">{songName}</div>
              <div className="now-playing__artist">{artistName}</div>
            </div>
            {/* <div className="background" style={backgroundImage} />{" "} */}
            <div>
              <button onClick={() => this.onPrevClick()}>Previous</button>
              <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
              <button onClick={() => this.onNextClick()}>Next</button>
            </div>
            <Feeling state={this.state}/>
            {/* <Feeling sadClick={this.state.sadClick.bind(this)} tracks={usersTopSongs}/> */}
        </div>) : <Login  />}
      </div>
    );
  }
}

export default App;

