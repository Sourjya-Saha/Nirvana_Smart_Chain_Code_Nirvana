import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../../constants/theme';
import TactileButton from '../../../components/TactileButton';
import AuroraCard from '../../../components/AuroraCard';
import AmbientAura from '../../../components/AmbientAura';

export default function Printed({ route, navigation }) {
  const { uniqueid, storeid, storename } = route.params || {};
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [error, setError] = useState(null);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = {
        name: result.assets[0].name,
        size: result.assets[0].size,
        uri: result.assets[0].uri,
        type: 'application/pdf',
      };

      setSelectedFile(file);
    } catch (err) {
      Alert.alert('Selection Error', `Error picking file: ${err.message}`);
    }
  };

  const handleExtract = () => {
    if (!selectedFile) {
      Alert.alert('File Required', 'Please select a prescription document first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      type: 'application/pdf',
      name: selectedFile.name,
    });
    formData.append('file_format', 'prescription');

    setLoading(true);
    setError(null);
    fetch('http://192.168.29.173:5000/extractFromDoc', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          let filteredData = data.message;
          if (filteredData.medicines && Array.isArray(filteredData.medicines)) {
            filteredData.medicines = filteredData.medicines.filter(
              (med) => med.length > 1
            );
          }
          setExtractedData(filteredData);
          setError(null);
        } else {
          setError(data.error || 'Unable to read prescription.');
        }
      })
      .catch((err) => {
        setError('Error occurred while reading prescription.');
        console.error('Error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = () => {
    if (extractedData.medicines && extractedData.medicines.length > 0) {
      navigation.navigate('Store', {
        searchMedicines: extractedData.medicines,
        uniqueid,
        storeid,
        storename,
      });
    } else {
      Alert.alert('Notice', 'No medicines found in this prescription.');
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Ambient Header Aura ── */}
      <AmbientAura variant="header" />

      {/* Top iOS Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Upload Prescription</Text>
          <Text style={styles.headerSubtitle}>OCR digital medicine extraction</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pharmacy Info (if navigated from store) */}
        {storename && (
          <View style={styles.pharmacyCard}>
            <View style={styles.cardHighlight} />
            <View style={styles.pharmacyIconWrap}>
              <Ionicons name="storefront" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.pharmacyInfo}>
              <Text style={styles.pharmacyName}>{storename}</Text>
              <Text style={styles.pharmacyMeta}>Selected dispensary for order matching</Text>
            </View>
          </View>
        )}

        {/* Upload Dropzone Card */}
        <TouchableOpacity
          style={[styles.dropzone, selectedFile && styles.dropzoneSelected]}
          onPress={handleFilePick}
          activeOpacity={0.8}
        >
          <View style={styles.cardHighlight} />
          <View style={styles.dropzoneIconCircle}>
            <Ionicons
              name={selectedFile ? 'document-text' : 'cloud-upload'}
              size={32}
              color={Theme.colors.primary}
            />
          </View>
          <Text style={styles.dropzoneTitle}>
            {selectedFile ? selectedFile.name : 'Choose Prescription PDF'}
          </Text>
          <Text style={styles.dropzoneSub}>
            {selectedFile
              ? `${Math.round((selectedFile.size || 0) / 1024)} KB · Tap to choose different file`
              : 'Tap to browse PDF files from your device'}
          </Text>
        </TouchableOpacity>

        {/* Extract Button */}
        {selectedFile && (
          <View style={styles.actionBtnWrap}>
            <TactileButton
              title={loading ? 'Analyzing Prescription...' : 'Read Prescription'}
              icon="scan-outline"
              variant="primary"
              size="large"
              onPress={handleExtract}
              disabled={loading}
            />
          </View>
        )}

        {/* Error Feedback */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={Theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Extracted Medicines Card */}
        {extractedData.medicines && extractedData.medicines.length > 0 && (
          <View style={styles.resultsCard}>
            <View style={styles.cardHighlight} />
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Identified Medicines</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {extractedData.medicines.length} found
                </Text>
              </View>
            </View>

            <View style={styles.compoundsList}>
              {extractedData.medicines.map((med, idx) => (
                <View key={idx} style={styles.compoundRow}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color={Theme.colors.success} />
                  </View>
                  <Text style={styles.compoundName}>{med}</Text>
                </View>
              ))}
            </View>

            {/* Shop Medicines */}
            <TactileButton
              title="Find These Medicines in Store"
              icon="bag-check-outline"
              variant="primary"
              size="large"
              onPress={handleSubmit}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.canvasParchment,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Theme.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.canvasParchment,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  pharmacyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  pharmacyMeta: {
    fontSize: 12,
    color: Theme.colors.inkMuted48,
    marginTop: 2,
  },
  dropzone: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xxl,
    borderWidth: 1.5,
    borderColor: '#d2d2d7',
    borderStyle: 'dashed',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  dropzoneSelected: {
    borderColor: Theme.colors.primary,
    borderStyle: 'solid',
    backgroundColor: '#fbfdff',
  },
  dropzoneIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...Theme.shadows.skeuoCircle,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.ink,
    textAlign: 'center',
    letterSpacing: Theme.typography.tracking.tight,
  },
  dropzoneSub: {
    fontSize: 13,
    color: Theme.colors.inkMuted48,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionBtnWrap: {
    marginBottom: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff1f0',
    padding: 14,
    borderRadius: Theme.radius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  errorText: {
    fontSize: 13,
    color: Theme.colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  resultsCard: {
    backgroundColor: Theme.colors.canvas,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
    overflow: 'hidden',
    ...Theme.shadows.skeuoCard,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.ink,
    letterSpacing: Theme.typography.tracking.tight,
  },
  countBadge: {
    backgroundColor: '#eff5ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  compoundsList: {
    marginBottom: 18,
  },
  compoundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.hairline,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e6f7ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compoundName: {
    fontSize: 15,
    color: Theme.colors.ink,
    fontWeight: '500',
    letterSpacing: Theme.typography.tracking.tight,
  },
});