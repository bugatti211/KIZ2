import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    width: 320,
    backgroundColor: '#f7f7fa',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1.5,
    padding: 10,
    borderRadius: 7,
    fontSize: 18,
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
  },
});
