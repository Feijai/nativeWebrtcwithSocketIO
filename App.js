import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import CallScreen from './src/screens/CallScreen';
import {Provider} from 'react-redux';
import LoginScreen from './src/screens/LoginScreen';
import store from './src/store/index';
const Stack = createStackNavigator();

const StackNavigation = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          {/* <Stack.Screen name="CallScreen" component={CallScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default StackNavigation;
