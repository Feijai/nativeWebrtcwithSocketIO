import io from 'socket.io-client';
import {RTCPeerConnection} from 'react-native-webrtc';

import {
  CHANGE_REMOTE_LIST,
  CHANGE_ROOM_LIST,
  SET_SOCKET_ACTIVE,
  SET_SHOW_SHEET,
  SET_ROOM_ID,
  SET_CALLING,
  SET_LOCAL_STREAM,
  SET_REMOTE_STREAM,
  GET_MEDIA,
} from '../constant';

const url = 'https://919a-152-101-20-97.jp.ngrok.io';
const initState = {
  socketActive: false,
  calling: false,
  showSheet: false,
  localStream: '',
  socket: io(url, {transports: ['websocket']}),
  callToUsername: '',
  roomID: 'myroom',
  remoteList: {},
  roomList: [],
  pcPeers: {},
  yourConn: new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302',
      },
    ],
  }),
  info: 'Initializing',
  status: 'init',
  isFront: true,
  audio: false,
  video: false,
};

export default function getCallReducer(preState = initState, action) {
  const {type, data} = action;
  switch (type) {
    case CHANGE_REMOTE_LIST:
      return {
        ...preState,
        remoteList: data,
      };

    case CHANGE_ROOM_LIST:
      return {
        ...preState,
        roomList: data,
      };

    case SET_SOCKET_ACTIVE:
      return {
        ...preState,
        socketActive: data,
      };

    case SET_SHOW_SHEET:
      return {
        ...preState,
        showSheet: data,
      };

    case SET_ROOM_ID:
      return {
        ...preState,
        roomID: data,
      };

    case SET_CALLING:
      return {
        ...preState,
        calling: data,
      };

    case SET_LOCAL_STREAM:
      return {
        ...preState,
        localStream: data,
      };

    case SET_REMOTE_STREAM:
      return {
        ...preState,
        remoteStream: data,
      };

    case GET_MEDIA:
      return {...preState};

    default:
      return preState;
  }
}
