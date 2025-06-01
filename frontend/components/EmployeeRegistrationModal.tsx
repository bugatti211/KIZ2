import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { styles } from '../app/styles/ProfileScreenStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employeeName: string;
  setEmployeeName: (value: string) => void;
  employeeEmail: string;
  setEmployeeEmail: (value: string) => void;
  employeePassword: string;
  setEmployeePassword: (value: string) => void;
  employeeRole: string;
  setEmployeeRole: (value: string) => void;
  employeeError: string;
  employeeRoles: string[];
}

export const EmployeeRegistrationModal = ({
  visible,
  onClose,
  onSubmit,
  employeeName,
  setEmployeeName,
  employeeEmail,
  setEmployeeEmail,
  employeePassword,
  setEmployeePassword,
  employeeRole,
  setEmployeeRole,
  employeeError,
  employeeRoles
}: Props) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <View style={styles.modalView}>
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              <Text style={styles.modalTitle}>Регистрация сотрудника</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Имя сотрудника"
                value={employeeName}
                onChangeText={setEmployeeName}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={employeeEmail}
                onChangeText={setEmployeeEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                value={employeePassword}
                onChangeText={setEmployeePassword}
                secureTextEntry
                autoComplete="password-new"
                returnKeyType="done"
              />
              
              <View style={styles.roleButtons}>
                {employeeRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      employeeRole === role && styles.roleButtonSelected
                    ]}
                    onPress={() => setEmployeeRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        employeeRole === role && styles.roleButtonTextSelected
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {employeeError ? (
                <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
                  {employeeError}
                </Text>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.button}
                  onPress={onSubmit}
                >
                  <Text style={styles.buttonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
