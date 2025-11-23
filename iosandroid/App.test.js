// Минимальный тестовый App.js для проверки
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { View, Text, StyleSheet } from 'react-native';

function TestApp() {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 TEST APP LOADED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Приложение загружено!</Text>
      <Text style={styles.text}>Если видите это - проблема НЕ в коде</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    margin: 10,
    textAlign: 'center',
  },
});

export default registerRootComponent(TestApp);
