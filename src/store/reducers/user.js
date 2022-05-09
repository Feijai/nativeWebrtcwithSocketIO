import {SET_USER_ID} from '../constant';
const initState = {
  userId: '',
};

export default function getUserIdReducer(preState = initState, action) {
  const {type, data} = action;
  // console.log('===user data==', data);
  switch (type) {
    case SET_USER_ID:
      return {
        userId: data,
      };

    default:
      return preState;
  }
}
