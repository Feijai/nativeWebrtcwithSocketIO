import {call, put, select, takeEvery, takeLatest} from 'redux-saga/effects';

import {
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

import {
  GET_MEDIA,
  HANDLE_CANDIDATE,
  HANDLE_ANSWER,
  HANDLE_OFFER,
  CALL_SOMEONE,
  HANDLE_LEAVE,
  SET_LOCAL_STREAM,
  SET_CALLING,
  SET_REMOTE_STREAM,
} from '../constant';

const getMedia = function* getMedia({payload}) {
  //   console.log('==in getMedia==');
  //   const yourConn = yield select(state => state.socketState.yourConn);
  //   const socket = yield select(state => state.socketState.socket);
  let isFront = true;
  const sourceInfos = yield call(mediaDevices.enumerateDevices);
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
  const stream = yield call(mediaDevices.getUserMedia, {
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
  });
  yield put({
    type: SET_LOCAL_STREAM,
    data: stream,
  });
};
const handleCandidate = function* handleCandidate({payload}) {
  yield put({
    type: SET_CALLING,
    payload: false,
  });
  const yourConn = yield select(state => state.socketState.yourConn);
  yourConn.addIceCandidate(new RTCIceCandidate(payload));
};

const handleAnswer = function* handleAnswer({payload}) {
  yield put({
    type: SET_CALLING,
    payload: false,
  });
  const yourConn = yield select(state => state.socketState.yourConn);
  yourConn.setRemoteDescription(new RTCSessionDescription(payload));
};

const handleOffer = function* handleOffer({payload}) {
  const {name, remoteOfferDescription} = payload;
  const yourConn = yield select(state => state.socketState.yourConn);
  const socket = yield select(state => state.socketState.socket);
  debugger;
  try {
    yield call(
      [yourConn, yourConn.setRemoteDescription],
      new RTCSessionDescription(remoteOfferDescription),
    );
    const answer = yield call([yourConn, yourConn.createAnswer]);
    yield call([yourConn, yourConn.setLocalDescription], answer);
    socket.emit('answer', name, answer);
  } catch (err) {
    console.log('Offerr Error', err);
  }
};
const callSomeOne = function* callSomeOne({payload}) {
  const {yourConn, callToUsername} = yield select(state => state.socketState);
  const socket = yield select(state => state.socketState.socket);
  const userId = yield select(state => state.userId.userId);
  yield put({
    type: SET_CALLING,
    payload: true,
  });
  const localDescription = yield call([yourConn, yourConn.createOffer]);
  yield call([yourConn, yourConn.setLocalDescription], localDescription);
  socket.emit('join-room', userId, callToUsername, yourConn.localDescription);
};
const handleLeave = function* handleLeave({payload}) {
  const yourConn = yield select(state => state.socketState.yourConn);
  yield put({
    type: SET_REMOTE_STREAM,
    payload: {toURL: () => null},
  });
  yourConn.close();
  yourConn.onicecandidate = null;
  yourConn.onaddstream = null;
};

const root = function* root() {
  yield takeLatest(GET_MEDIA, getMedia);
  yield takeLatest(HANDLE_CANDIDATE, handleCandidate);
  yield takeLatest(HANDLE_ANSWER, handleAnswer);
  yield takeLatest(HANDLE_OFFER, handleOffer);
  yield takeLatest(CALL_SOMEONE, callSomeOne);
  yield takeLatest(HANDLE_LEAVE, handleLeave);
};

export default root;
