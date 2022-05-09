import React, {Component, useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import {button, container, rtcView, text} from '../styles';
import log from '../debug/log';
import logError from '../debug/logError';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CallActionBox from '../component/CallActionBox';
import {
  changeRemoteListAction,
  createGetMediaAction,
  createSetLocalStreamAction,
} from '../store/actions/call';
import {connect, useSelector} from 'react-redux';
import {
  SET_SOCKET_ACTIVE,
  GET_MEDIA,
  SET_SHOW_SHEET,
  CHANGE_REMOTE_LIST,
  SET_ROOM_ID,
  CHANGE_ROOM_LIST,
  SET_LOCAL_STREAM,
} from '../store/constant';
import store from '../store';

const url = 'https://919a-152-101-20-97.jp.ngrok.io';
const socket = io.connect(url, {transports: ['websocket']});
const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};

let pcPeers = {};
let appClass;
let localStream;

const getLocalStream = () => {
  let isFront = true;

  mediaDevices.enumerateDevices().then(sourceInfos => {
    let videoSourceId;
    for (let i = 0; i < sourceInfos.length; i++) {
      const sourceInfo = sourceInfos[i];
      if (
        sourceInfo.kind == 'videoinput' &&
        sourceInfo.facing == (isFront ? 'front' : 'environment')
      ) {
        videoSourceId = sourceInfo.deviceId;
      }
    }
    mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          mandatory: {
            minWidth: 500, // Provide your own width, height and frame rate here
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode: isFront ? 'user' : 'environment',
          optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        },
      })
      .then(stream => {
        // Got stream!
        localStream = stream;
        appClass.setState({
          streamURL: stream.toURL(),
          status: 'ready',
          info: 'Welcome to WebRTC demo',
        });
      })
      .catch(error => {
        // Log error
      });
  });
};

const join = roomID => {
  let onJoin = socketIds => {
    for (const i in socketIds) {
      if (socketIds.hasOwnProperty(i)) {
        const socketId = socketIds[i];
        createPC(socketId, true);
      }
    }
  };

  socket.emit('join', roomID, onJoin);
};

const createPC = (socketId, isOffer) => {
  const peer = new RTCPeerConnection(configuration);

  pcPeers = {
    ...pcPeers,
    [socketId]: peer,
  };

  peer.onnegotiationneeded = async () => {
    if (isOffer) {
      try {
        await peer.setLocalDescription(await peer.createOffer());
        socket.emit('exchange', {
          to: socketId,
          sdp: peer.localDescription,
          type: 'offer',
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  peer.addStream(localStream);

  peer.onaddstream = event => {
    const remoteList = appClass.state.remoteList;

    remoteList[socketId] = event.stream.toURL();
    appClass.setState({
      info: 'One peer join!',
      remoteList: remoteList,
    });
  };

  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('exchange', {to: socketId, candidate: event.candidate});
    }
  };

  peer.oniceconnectionstatechange = event => {
    //console.log('oniceconnectionstatechange', event.target.iceConnectionState);
    if (event.target.iceConnectionState === 'completed') {
      //console.log('event.target.iceConnectionState === 'completed'');
      setTimeout(() => {
        getStats();
      }, 1000);
    }
    if (event.target.iceConnectionState === 'connected') {
      //console.log('event.target.iceConnectionState === 'connected'');
    }
  };

  peer.onsignalingstatechange = event => {
    //console.log('on signaling state change', event.target.signalingState);
  };

  peer.onremovestream = event => {
    //console.log('on remove stream', event.stream);
  };

  return peer;
};

socket.on('exchange', data => {
  exchange(data);
});
socket.on('leave', socketId => {
  leave(socketId);
});

const exchange = async data => {
  let fromId = data.from;

  let peer;
  if (fromId in pcPeers) {
    peer = pcPeers[fromId];
  } else {
    peer = createPC(fromId, false);
  }

  if (data.sdp) {
    let sdp = new RTCSessionDescription(data.sdp);

    if (data.type == 'offer') {
      await peer.setRemoteDescription(sdp);
      await peer.setLocalDescription(await peer.createAnswer());
      socket.emit('exchange', {
        to: fromId,
        sdp: peer.localDescription,
        type: 'answer',
      });
    } else if (data.type == 'answer') {
      await peer.setRemoteDescription(sdp);
    }
  } else {
    peer.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

const leave = socketId => {
  const peer = pcPeers[socketId];

  peer.close();

  delete pcPeers[socketId];

  const remoteList = appClass.state.remoteList;

  delete remoteList[socketId];

  appClass.setState({
    info: 'One peer left!',
    remoteList: remoteList,
  });
};

const mapHash = (hash, func) => {
  const array = [];
  for (const key in hash) {
    if (hash.hasOwnProperty(key)) {
      const obj = hash[key];
      array.push(func(obj, key));
    }
  }
  return array;
};

const getStats = () => {
  const pc = pcPeers[Object.keys(pcPeers)[0]];
  if (
    pc.getRemoteStreams()[0] &&
    pc.getRemoteStreams()[0].getAudioTracks()[0]
  ) {
    const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    let callback = report => console.log('getStats report', report);

    pc.getStats(track, callback, logError);
  }
};

class CallScreen extends Component {
  constructor(props) {
    super(props);
  }
  state = {
    info: 'Initializing',
    status: 'init',
    roomID: 'myroom',
    isFront: true,
    streamURL: null,
    remoteList: {},
    audio: false,
    video: false,
  };

  componentDidMount() {
    appClass = this;
    getLocalStream();
  }

  switchCamera = () => {
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  handleStreamAudio = () => {
    this.setState({
      audio: !this.state.audio,
    });
    localStream.getAudioTracks().forEach(item => {
      item.enabled = this.state.audio;
    });
  };

  handleStreamVideo = () => {
    this.setState({
      ...this.state,
      video: !this.state.video,
    });
    localStream.getVideoTracks().forEach(item => {
      item.enabled = this.state.video;
    });
  };

  onPress = () => {
    this.setState({
      status: 'connect',
      info: 'Connecting',
    });

    join(this.state.roomID);
  };

  button = (func, text) => (
    <TouchableOpacity style={button.container} onPress={func}>
      <Text style={button.style}>{text}</Text>
    </TouchableOpacity>
  );

  audioButton = (func, state) => {
    return (
      <View style={styles.buttonsContainer}>
        <Pressable style={styles.iconButton} onPress={func}>
          <Icon
            name={state.video ? 'camera-off' : 'camera'}
            size={30}
            color={'white'}
          />
        </Pressable>
      </View>
    );
  };

  render() {
    const {status, info, streamURL, remoteList} = this.state;

    return (
      <View style={container.style}>
        <Text style={text.style}>{info}</Text>

        {status === 'ready' ? this.button(this.onPress, 'Enter room') : null}

        {mapHash(remoteList, (remote, index) => {
          return (
            <RTCView key={index} streamURL={remote} style={rtcView.style} />
          );
        })}

        <RTCView streamURL={streamURL} style={rtcView.style} />
        <CallActionBox
          state={this.state}
          switchCamera={this.switchCamera}
          handleStreamVideo={this.handleStreamVideo}
          handleStreamAudio={this.handleStreamAudio}
          // onHangupPress={''}
        />
      </View>
    );
  }
}

const mapStateToProps = state => ({
  userId: state.userId.userId,
  socketActive: state.socketState.socketActive,
  calling: state.socketState.calling,
  // localStream: state.socketState.localStream,
  socket: state.socketState.socket,
  // yourConn: state.socketState.yourConn,
  // remoteList: state.socketState.remoteList,
  roomID: state.socketState.roomID,
  roomList: state.socketState.roomList,
  showSheet: state.socketState.showSheet,
  pcPeers: state.socketState.pcPeers,
});

export default connect(mapStateToProps, {
  getMedia: createGetMediaAction,
  getRemote: changeRemoteListAction,
})(CallScreen);
