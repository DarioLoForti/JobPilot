import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Opzionale: Registra un font se vuoi (altrimenti usa Helvetica di default)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

// Stili per il PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: 10
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
    color: '#1976d2'
  },
  contact: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1976d2',
    borderBottom: '1px solid #ddd',
    paddingBottom: 2
  },
  content: {
    fontSize: 11,
    marginBottom: 4
  }
});

// Il componente Documento PDF
const MyDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Intestazione */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.first_name} {data.last_name}</Text>
        <Text style={styles.contact}>{data.email} | {data.phone}</Text>
        <Text style={styles.contact}>{data.address}</Text>
      </View>

      {/* Sommario */}
      {data.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profilo Professionale</Text>
          <Text style={styles.content}>{data.summary}</Text>
        </View>
      )}

      {/* Esperienza */}
      {data.experience && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esperienza Lavorativa</Text>
          <Text style={styles.content}>{data.experience}</Text>
        </View>
      )}

      {/* Istruzione */}
      {data.education && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Istruzione</Text>
          <Text style={styles.content}>{data.education}</Text>
        </View>
      )}

      {/* Skills */}
      {data.skills && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competenze</Text>
          <Text style={styles.content}>{data.skills}</Text>
        </View>
      )}

    </Page>
  </Document>
);

// QUESTA RIGA MANCAVA ED È QUELLA CHE CAUSA L'ERRORE:
export default MyDocument;