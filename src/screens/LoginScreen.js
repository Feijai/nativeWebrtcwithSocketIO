import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button, TextInput} from 'react-native-paper';
import {connect} from 'react-redux';
import {createSetUserIdAction} from '../store/actions/user';

function LoginScreen(props) {
  // const {userId} = props;
  const [userId, setUserId] = useState('');
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.heading}>Enter your id</Text>
        <TextInput
          label="Your  ID"
          onChangeText={text => setUserId(text)}
          mode="outlined"
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={() => props.getLoginUserId(userId)}
          style={styles.btn}
          contentStyle={styles.btnContent}
          disabled={userId?.length === 0}>
          Login
        </Button>
      </View>
    </View>
  );
}

export default connect(state => ({userId: state.userId}), {
  getLoginUserId: createSetUserIdAction,
})(LoginScreen);
// export default LoginScreen;

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    height: 60,
    marginBottom: 10,
  },
  btn: {
    height: 60,
    alignItems: 'stretch',
    justifyContent: 'center',
    fontSize: 18,
  },
  btnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
});
