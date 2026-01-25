import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Link, Font } from '@react-pdf/renderer';

// Funzione di utility per formattare le date (da 2024-01-01 a Gen 2024)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('it-IT', { month: 'short', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalizza il mese
};

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    fontFamily: 'Helvetica',
    padding: 0 
  },
  
  // --- COLONNA SINISTRA (DARK SIDE) ---
  leftColumn: {
    width: '32%', 
    backgroundColor: '#1e293b', // Slate 800
    color: '#f8fafc', 
    padding: 25, 
    height: '100%'
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    border: '3px solid #4f46e5' // Indigo
  },
  sectionLeftTitle: {
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#818cf8', // Indigo 400
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  contactItem: {
    marginBottom: 10
  },
  contactLabel: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 2
  },
  contactValue: {
    fontSize: 9,
    color: '#f1f5f9'
  },
  socialLink: {
    fontSize: 9,
    color: '#a5b4fc', // Indigo 300
    textDecoration: 'none',
    marginBottom: 4
  },
  skillTag: {
    fontSize: 9,
    color: '#cbd5e1',
    marginBottom: 4,
    lineHeight: 1.4
  },

  // --- COLONNA DESTRA (MAIN CONTENT) ---
  rightColumn: {
    width: '68%', 
    padding: 40, 
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 25
  },
  name: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#0f172a',
    letterSpacing: -0.5
  },
  title: { 
    fontSize: 12, 
    color: '#4f46e5', 
    marginTop: 4,
    fontWeight: 'medium',
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginTop: 22,
    marginBottom: 10,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 4
  },
  paragraph: { 
    fontSize: 10, 
    lineHeight: 1.6, 
    color: '#334155', 
    textAlign: 'justify' 
  },
  
  // Elementi delle liste
  itemBlock: { 
    marginBottom: 15 
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2
  },
  itemRole: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  itemDate: { 
    fontSize: 9, 
    color: '#64748b' 
  },
  itemSub: { 
    fontSize: 9, 
    color: '#4f46e5', 
    marginBottom: 5,
    fontWeight: 'medium'
  },
  itemDesc: { 
    fontSize: 9, 
    color: '#475569', 
    lineHeight: 1.5 
  }
});

const MyDocument = ({ data, image }) => {
  // Parsing sicuro degli array
  const safeParse = (val) => {
    if (Array.isArray(val)) return val;
    try { return val ? JSON.parse(val) : []; } catch(e) { return []; }
  };

  const experiences = safeParse(data.experiences);
  const education = safeParse(data.education);
  const certifications = safeParse(data.certifications);
  const socials = safeParse(data.socials);

  return (
    <Document title={`CV ${data.first_name} ${data.last_name}`}>
      <Page size="A4" style={styles.page}>
        
        {/* --- SIDEBAR --- */}
        <View style={styles.leftColumn}>
          <View style={styles.photoContainer}>
            {image ? (
              <Image src={image} style={styles.photo} />
            ) : (
              <View style={[styles.photo, { backgroundColor: '#334155' }]} />
            )}
          </View>

          <Text style={styles.sectionLeftTitle}>Contatti</Text>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{data.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Telefono</Text>
            <Text style={styles.contactValue}>{data.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Località</Text>
            <Text style={styles.contactValue}>{data.address}</Text>
          </View>

          {socials.length > 0 && (
            <>
              <Text style={styles.sectionLeftTitle}>Social & Web</Text>
              {socials.map((soc, i) => (
                <Link key={i} src={soc.url} style={styles.socialLink}>
                  • {soc.platform}
                </Link>
              ))}
            </>
          )}

          <Text style={styles.sectionLeftTitle}>Competenze Tecniche</Text>
          <Text style={styles.skillTag}>{data.hard_skills}</Text>

          <Text style={styles.sectionLeftTitle}>Soft Skills</Text>
          <Text style={styles.skillTag}>{data.soft_skills}</Text>
          
          {certifications.length > 0 && (
            <>
              <Text style={styles.sectionLeftTitle}>Certificazioni</Text>
              {certifications.map((cert, i) => (
                <Text key={i} style={styles.skillTag}>- {cert.name} ({cert.year})</Text>
              ))}
            </>
          )}
        </View>

        {/* --- MAIN CONTENT --- */}
        <View style={styles.rightColumn}>
          <View style={styles.header}>
            <Text style={styles.name}>{data.first_name} {data.last_name}</Text>
            <Text style={styles.title}>Curriculum Vitae Professionale</Text>
          </View>

          <Text style={styles.sectionTitle}>Profilo Personale</Text>
          <Text style={styles.paragraph}>{data.personal_description}</Text>

          {experiences.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Esperienza Lavorativa</Text>
              {experiences.map((exp, i) => (
                <View key={i} style={styles.itemBlock}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemRole}>{exp.role}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(exp.dateStart)} — {exp.current ? 'Presente' : formatDate(exp.dateEnd)}
                    </Text>
                  </View>
                  <Text style={styles.itemSub}>{exp.company}</Text>
                  <Text style={styles.itemDesc}>{exp.description}</Text>
                </View>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Istruzione e Formazione</Text>
              {education.map((edu, i) => (
                <View key={i} style={styles.itemBlock}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemRole}>{edu.degree}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(edu.dateStart)} — {formatDate(edu.dateEnd)}
                    </Text>
                  </View>
                  <Text style={styles.itemSub}>{edu.school} {edu.city ? `(${edu.city})` : ''}</Text>
                  {edu.description && <Text style={styles.itemDesc}>{edu.description}</Text>}
                </View>
              ))}
            </>
          )}
        </View>

      </Page>
    </Document>
  );
};

export default MyDocument;