import {SET_USER_ID} from '../constant';

export const createSetUserIdAction = userId => ({
  type: SET_USER_ID,
  data: userId,
});
