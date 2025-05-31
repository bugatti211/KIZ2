import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Container and layout styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  fullWidth: {
    width: '100%',
  },
  flexOne: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  spacedRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  maxHeightContent: {
    maxHeight: '80%',
  },

  // Card and list item styles
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  adBlock: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  categoryBlock: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  // Role selection styles
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  roleButtonSelected: {
    backgroundColor: '#2196F3',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#333',
  },
  roleButtonTextSelected: {
    color: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },

  // Text styles
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  whiteText: {
    color: '#fff',
  },
  boldText: {
    fontWeight: 'bold',
  },

  // Icon and button styles
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  buttonSecondary: {
    backgroundColor: '#e0e0e0',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  approveBtn: {
    backgroundColor: '#4caf50',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  rejectBtn: {
    backgroundColor: '#e53935',
    padding: 8,
    borderRadius: 6,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
  },

  // Input styles
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    marginHorizontal: -8,
    marginTop: -4,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  // Supply-specific styles
  supplyButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  supplyButton: {
    backgroundColor: '#2196F3',
    marginVertical: 5,
    width: '100%',
  },

  // Margin helper
  marginTop16: {
    marginTop: 16,
  },
});