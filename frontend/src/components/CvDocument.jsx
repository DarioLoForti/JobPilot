import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Stili del PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  
  // Header con Foto
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: '#112131', 
    paddingBottom: 10 
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 15,
    objectFit: 'cover'
  },
  headerText: { 
    flexDirection: 'column' 
  },
  name: { 
    fontSize: 24, 
    textTransform: 'uppercase', 
    fontWeight: 'bold', 
    color: '#112131' 
  },
  contact: { 
    fontSize: 10, 
    color: '#555', 
    marginTop: 4 
  },
  
  // Sezioni
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginTop: 15, 
    marginBottom: 5, 
    color: '#2c3e50', 
    textTransform: 'uppercase' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#ddd', 
    marginBottom: 10 
  },
  
  // Elementi lista
  itemBlock: { marginBottom: 8 },
  itemTitle: { fontSize: 12, fontWeight: 'bold' },
  itemSubtitle: { fontSize: 10, fontStyle: 'italic', color: '#444' },
  itemDate: { fontSize: 9, color: '#777', marginBottom: 2 },
  itemDesc: { fontSize: 10, lineHeight: 1.4, textAlign: 'justify' },

  // Skills
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillTag: { 
    fontSize: 10, 
    backgroundColor: '#eee', 
    padding: '3 6', 
    borderRadius: 3, 
    marginRight: 5, 
    marginBottom: 5 
  }
});

export const CvDocument = ({ user, profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* 1. HEADER (Con Foto e Nome) */}
      <View style={styles.headerContainer}>
        {/* Mostra la foto solo se esiste. Nota: React-PDF richiede URL assoluti o base64 */}
        {user?.profile_picture && (
          <Image 
            style={styles.avatar} 
            src={user.profile_picture} 
          />
        )}
        
        <View style={styles.headerText}>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.contact}>{user?.email}</Text>
        </View>
      </View>

      {/* 2. ESPERIENZE */}
      <View>
        <Text style={styles.sectionTitle}>Esperienza Lavorativa</Text>
        <View style={styles.divider} />
        
        {profile?.experiences?.length > 0 ? (
            profile.experiences.map((exp) => (
            <View key={exp.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{exp.role}</Text>
                <Text style={styles.itemSubtitle}>{exp.company}</Text>
                <Text style={styles.itemDate}>
                {new Date(exp.start_date).toLocaleDateString()} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Presente'}
                </Text>
                {exp.description && <Text style={styles.itemDesc}>{exp.description}</Text>}
            </View>
            ))
        ) : (
            <Text style={{fontSize: 10, color: '#999'}}>Nessuna esperienza inserita.</Text>
        )}
      </View>

      {/* 3. ISTRUZIONE */}
      <View>
        <Text style={styles.sectionTitle}>Istruzione</Text>
        <View style={styles.divider} />
        
        {profile?.educations?.length > 0 ? (
            profile.educations.map((edu) => (
            <View key={edu.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{edu.school}</Text>
                <Text style={styles.itemSubtitle}>{edu.degree} - {edu.field}</Text>
                <Text style={styles.itemDate}>
                {new Date(edu.start_date).toLocaleDateString()}
                </Text>
            </View>
            ))
        ) : (
            <Text style={{fontSize: 10, color: '#999'}}>Nessuna formazione inserita.</Text>
        )}
      </View>

      {/* 4. SKILLS */}
      <View>
        <Text style={styles.sectionTitle}>Competenze</Text>
        <View style={styles.divider} />
        
        <View style={styles.skillRow}>
            {profile?.skills?.length > 0 ? (
                profile.skills.map((skill) => (
                    <Text key={skill.id} style={styles.skillTag}>
                        {skill.name} {Array(skill.level).fill('★').join('')}
                    </Text>
                ))
            ) : (
                <Text style={{fontSize: 10, color: '#999'}}>Nessuna skill inserita.</Text>
            )}
        </View>
      </View>

    </Page>
  </Document>
);