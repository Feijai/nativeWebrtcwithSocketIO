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

function CallScreen({
  dispatch,
  userId,
  socketActive,
  calling,
  // localStream,
  socket,
  roomID,
  roomList,
  audio,
  video,
  pcPeers,
  //function
  getMedia,
  getRemote,
}) {
  const [callScreenStatus, setCallScreenStatus] = useState({
    status: 'init',
    info: 'Initializing',
  });
  // let pcPeers = {};
  // let localStream;
  let myStream = {};
  const remoteList = useSelector(state => state.socketState.remoteList);
  const localStream = useSelector(state => state.socketState.localStream);
  const leave = socketId => {
    const peer = pcPeers[socketId];
    console.log('===pcPeers===', pcPeers);

    peer.close();
    setCallScreenStatus({
      status: 'init',
      info: 'Initializing',
    });
    getRemote({});
  };

  const ileave = () => {
    const keys = Object.keys(pcPeers);
    keys.forEach(key => {
      const pc = pcPeers[key];
      pc.close();
    });
    // socket.disconnect();
    socket.emit('leave');
    pcPeers = {};
    // dispatch({type: CHANGE_REMOTE_LIST, data: []});
  };

  // console.log('===socket===', socket);
  useEffect(() => {
    // dispatch({type: GET_MEDIA});
    getMedia();
    setCallScreenStatus({
      ...callScreenStatus,
      status: 'ready',
      info: 'Welcome to WebRTC demo',
    });
    return () => {
      ileave();
    };
  }, []);
  myStream = localStream;
  useEffect(() => {
    // console.log('===socket===', socket);
    if (socket.connected) {
      // dispatch({type: SET_SOCKET_ACTIVE, data: true});
      // let timer = null;
      // timer = setInterval(() => {
      //   socket.emit('list-server', {}, data => {
      //     // console.log('====================================');
      //     const entries = Object.entries(data);
      //     // console.log('====================================');
      //     dispatch({type: CHANGE_ROOM_LIST, data: entries});
      //   });
      // }, 10000);
      // });
      // return () => {
      //   if (timer) {
      //     clearInterval(timer);
      //     timer = null;
      //   }
      //   if (socket.connected) socket.close(); // close the socket if the view is unmounted
    }
  }, []);

  socket.on('exchange', data => {
    // console.log('==in exchange===', data);
    exchange(data);
  });
  socket.on('leave', socketId => {
    leave(socketId);
  });
  socket.on('disconnect', socketId => {
    dispatch({type: SET_SOCKET_ACTIVE, data: false});
    dispatch({type: CHANGE_ROOM_LIST, data: []});
    // if (timer) {
    //   clearInterval(timer);
    //   timer = null;
    // }
  });
  socket.on('error', function (exception) {
    console.log('SOCKET ERROR');
    // socket.destroy();
  });

  const join = roomID => {
    let onJoin = socketIds => {
      console.log('===socketIds===', socketIds);
      for (const i in socketIds) {
        if (socketIds.hasOwnProperty(i)) {
          const socketId = socketIds[i];
          createPC(socketId, true);
        }
      }
    };
    console.log('===roomID===', roomID);
    socket.emit('join', roomID, onJoin);
  };

  const createPC = (socketId, isOffer) => {
    console.log('===in createPC===');
    const configuration = {
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
    };

    console.log('===socketId===', socketId);
    // const localStream = store.getState().socketState.localStream;
    const peer = new RTCPeerConnection(configuration);

    pcPeers = {
      ...pcPeers,
      [socketId]: peer,
    };

    peer.onnegotiationneeded = async () => {
      if (isOffer) {
        try {
          const localDescription = await peer.createOffer();
          console.log('===localDescription===', localDescription);
          await peer.setLocalDescription(localDescription);
          socket.emit('exchange', {
            to: socketId,
            sdp: peer.localDescription,
            type: 'offer',
          });
        } catch (err) {
          console.log('===in error ===');
          console.error(err);
        }
      }
    };
    console.log('===myStream===', myStream);
    peer.addStream(myStream);
    console.log('===peer===', peer);
    peer.onaddstream = event => {
      console.log('===onaddstream===', event.stream);
      console.log('===onaddstream remoteList===', remoteList);
      remoteList[socketId] = event.stream.toURL();
      console.log('===peer remoteList ===', remoteList);
      getRemote(remoteList);
      setCallScreenStatus({
        ...callScreenStatus,
        info: 'One peer join!',
        remoteList: remoteList,
      });
    };

    peer.onicecandidate = event => {
      console.log('===onicecandidate event===', event);
      if (event.candidate) {
        socket.emit('exchange', {to: socketId, candidate: event.candidate});
      }
    };
    peer.oniceconnectionstatechange = event => {
      console.log(
        'oniceconnectionstatechange',
        event.target.iceConnectionState,
      );
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
    // log('Peer', peer);

    return peer;
  };

  const exchange = async data => {
    let fromId = data.from;
    // if (data.sdp) {
    //   log('Exchange', data);
    // }
    // console.log('===pcPeers===', pcPeers);
    let peer;
    if (fromId in pcPeers) {
      peer = pcPeers[fromId];
    } else {
      peer = createPC(fromId, false);
    }
    // console.log('data===', data);
    // log('Peer', peer);
    if (data.sdp) {
      // console.log('===data.sdp===', data.sdp);
      let sdp = new RTCSessionDescription(data.sdp);

      if (data.type == 'offer') {
        await peer.setRemoteDescription(sdp);
        await peer.setLocalDescription(await peer.createAnswer());
        console.log('===offer setLocalDescription===', peer);
        socket.emit('exchange', {
          to: fromId,
          sdp: peer.localDescription,
          type: 'answer',
        });
      } else if (data.type == 'answer') {
        await peer.setRemoteDescription(sdp);
      }
    } else {
      // console.log('exchange peer', data);
      peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const mapHash = (hash, func) => {
    //console.log(hash);
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

      //console.log('track', track);

      pc.getStats(track, callback, logError);
    }
  };

  const switchCamera = () => {
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  // handleStreamAudio = () => {
  //   this.setState({
  //     audio: !this.state.audio,
  //   });
  //   localStream.getAudioTracks().forEach(item => {
  //     item.enabled = this.state.audio;
  //   });
  // };

  // handleStreamVideo = () => {
  //   this.setState({
  //     ...this.state,
  //     video: !this.state.video,
  //   });
  //   localStream.getVideoTracks().forEach(item => {
  //     item.enabled = this.state.video;
  //   });
  // };

  const Button = ({roomID}) => {
    const onPress = roomID => {
      setCallScreenStatus({
        ...callScreenStatus,
        status: 'connect',
        info: 'Connecting',
      });
      console.log('join', roomID);
      join(roomID);
    };
    return (
      <TouchableOpacity
        style={button.container}
        onPress={() => onPress(roomID)}>
        <Text style={button.style}>{'Enter room'}</Text>
      </TouchableOpacity>
    );
  };

  const audioButton = (func, state) => {
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
  // console.log('===localStream===', localStream);
  // render() {
  //   const {status, info, streamURL, remoteList} = this.state;
  // const streamURL = store.getStats();
  return (
    <View style={container.style}>
      <Text style={text.style}>{callScreenStatus.info}</Text>

      {callScreenStatus.status === 'ready' ? <Button roomID={roomID} /> : null}
      {console.log('===in render remoteList===', remoteList)}
      {mapHash(remoteList, (remote, index) => {
        console.log('====in render remote===', remote);
        return <RTCView key={index} streamURL={remote} style={rtcView.style} />;
      })}

      {localStream ? (
        <RTCView streamURL={localStream.toURL()} style={rtcView.style} />
      ) : null}

      {/* <CallActionBox
          state={this.state}
          switchCamera={this.switchCamera}
          handleStreamVideo={this.handleStreamVideo}
          handleStreamAudio={this.handleStreamAudio}
          // onHangupPress={''}
        /> */}
    </View>
  );
  // }
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

// export default CallScreen;
