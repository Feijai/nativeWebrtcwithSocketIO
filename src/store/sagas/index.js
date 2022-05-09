import {all} from 'redux-saga/effects';

import call from './call';

const root = function* root() {
  yield all([call()]);
};

export default root;
