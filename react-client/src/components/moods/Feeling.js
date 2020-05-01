import React, {useState, useEffect} from 'react'
import {queuePlaylist} from '../helpers/api-fetcher'
import './feelings.css'
import { css } from "@emotion/core";
import ClipLoader from "react-spinners/ClipLoader";

// const select_songs_for_feeling(props){
//   console.log(props)

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const Feeling = (props) => {
  const {userId, token, playlists} = props
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState('now Playing');
  console.log(props)
  // if(token && playlists){
  //   const sadClick = async () =>{
  //    let queue = await queuePlaylist(playlists['Sad Music MoodLifter']['id'], token, playlists['Sad Music MoodLifter']['uri'])
  //    setLoading({false})
  //   }
  // }
  
  return (
    <div >
      {/* <div className='white f3'>
          {'Click your Mood!!!'}
      </div>
      <div className='center pa3'>
          <div className='form pa4 br3 shadow-5 ph3'>
            {/* <button className='w-33 grow no-underline f4 br-pill b bw2 ph3 pv2 mb2 dib white bg-orange'>HAPPY</button> */}
            {/* <button className='w-33 grow no-underline f4 br-pill b bw2 ph3 pv2 mb2 dib white bg-yellow'>HAPPY</button> */}
            {/* <button onClick={sadClick}  className='w-33 grow no-underline f4 br-pill b bw2 ph3 pv2 mb2 dib white bg-light-blue' >SAD</button> */}
            {/* <button className='w-33 grow no-underline f4 br-pill b bw2 ph3 pv2 mb2 dib white bg-red'>ANGRY</button> */}
          {/* </div> */}
      {/* </div> */} */}
      <p className='f3'>
          {'Loading Music'}
      </p>
    </div>
  );
}

export default Feeling