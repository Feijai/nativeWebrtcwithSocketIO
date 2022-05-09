import {
  SOCKET_CONNECT,
  CHANGE_REMOTE_LIST,
  GET_MEDIA,
  SET_LOCAL_STREAM,
} from '../constant';
import {mediaDevices} from 'react-native-webrtc';

export const createSocketConnectAction = () => ({
  type: SOCKET_CONNECT,
});

export const changeRemoteListAction = data => ({
  type: CHANGE_REMOTE_LIST,
  data: data,
});

export function createGetMediaAction() {
  return async dispatch => {
    try {
      let isFront = true;
      await mediaDevices.enumerateDevices().then(sourceInfos => {
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
            console.log(stream);
            dispatch(createSetLocalStreamAction(stream));
          });
      });
    } catch (err) {
      console.log(err);
    }
  };
}

export const createSetLocalStreamAction = data => ({
  type: SET_LOCAL_STREAM,
  data: data,
});
