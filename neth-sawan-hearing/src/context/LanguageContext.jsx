// src/context/LanguageContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';

const translations = {
  en: {
    appName: 'Neth-Sawan',
    tagline: 'Visual Hearing Assistant',
    alertsOn: 'Alerts ON',
    alertsOff: 'Alerts OFF',
    roadSafeOn: 'Road Safe ON',
    roadSafeOff: 'Road Safe OFF',
    listening: 'LISTENING',
    stopped: 'STOPPED',
    guest: 'Guest',
    localData: 'Local Data',
    online: 'Online',
    user: 'User',
    signOut: 'Sign Out',
    howItWorks: 'How It Works',

    // Sidebar navigation (Sinhala is primary, English is secondary in the UI)
    home: 'මුල් පිටුව',
    homeEn: 'Home',
    aiVision: 'AI දෘෂ්ටිය',
    aiVisionEn: 'AI Vision',
    learnSigns: 'සංඥා ඉගෙන ගන්න',
    learnSignsEn: 'Learn Signs',
    community: 'ප්‍රජාව',
    communityEn: 'Community',
    alerts: 'ඇඟවීම්',
    alertsEn: 'Alerts',
    contacts: 'සම්බන්ධතා',
    contactsEn: 'Contacts',
    sosSide: 'හදිසි අවස්ථා',
    sosSideEn: 'SOS',
    roadMonitor: 'මාර්ග ආරක්ෂාව',
    roadMonitorEn: 'Road Monitor',
    accessibility: 'ප්‍රවේශ්‍යතාව',
    accessibilityEn: 'Accessibility',

    // SOS / Emergency
    sosCenter: 'SOS Emergency Center',
    sos: 'SOS',
    police: 'Police',
    ambulance: 'Ambulance',
    emergencyInstructions: 'Emergency Instructions',
    redFlashing: 'Red Flashing Screen = Emergency detected or SOS activated',
    vibration: 'Phone Vibration = Alert being sent to your contacts',
    contactsNotify: 'Emergency Contacts = Will receive WhatsApp/SMS alerts',
    liveLocation: 'Live Location = Automatically shared with emergency contacts',

    // Toast messages
    loggedOut: 'Logged out',
    logoutFailed: 'Logout failed',
    guestModeActivated: 'Guest mode activated',
    guestSignedOut: 'Signed out from guest mode',
    switchedToSinhala: 'Switched to Sinhala',
    switchedToEnglish: 'Switched to English',

    // Accessibility settings (if needed)
    accessibilitySettings: 'Accessibility Settings',
    fontSize: 'Font Size',
    colorAccessibility: 'Color Accessibility',
    colorThemes: 'Color Themes',
    resetAll: 'Reset All Settings',
    dedicatedRoadSafety: 'Full‑screen detection of horns, sirens, engines',
    noEmergencyAlerts: "You won't receive visual alerts or emergency flashes.",
    enableNow: 'Enable Now',
    notificationToggle: 'Notification Toggle = Disable alerts when needed',

    // Road safety
    roadSafetyMonitor: 'Road Safety Monitor',
    startMonitoring: 'Start Road Safety Monitoring',
    stopMonitoring: 'Stop Monitoring',
    safetyTips: 'Safety Tips for Deaf Pedestrians',

    // Emergency contacts
    emergencyContacts: 'Emergency Contacts',
    addContact: '+ Add Contact',
    fullName: 'Full Name *',
    phoneNumber: 'Phone Number',
    email: 'Email',
    relation: 'Relation',
    notificationMethods: 'Notification Methods',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    phoneCall: 'Phone Call',
    desktop: 'Desktop',
    autoSendWhatsApp: 'Auto-send WhatsApp on emergency',
    saveContact: 'Save Contact',
    cancel: 'Cancel',
    noContacts: 'No emergency contacts added yet.',
    edit: 'Edit',
    remove: 'Remove',

    // Transcript
    liveCaptionsSign: 'Live Captions & Sign Language',
    soundMonitor: 'Sound Monitor',
    soundWaveHistory: 'Sound Wave & History',
    startListening: 'Start Listening',
    stopListening: 'Stop Listening',
    words: 'words',
    characters: 'characters',
    pressStartToListen: 'Press "Start Listening" below, then speak to see captions',
    browserNotSupported: 'Your browser does not support Speech Recognition. Try Chrome, Edge, or Safari (iOS 14.3+).',
    mobileMicrophoneRequired: 'Mobile Microphone Required',
    mobileMicrophoneHint: 'When you tap "Start Listening", your browser will ask for microphone permission. Please allow it.',
    brailleTranslation: 'Braille Translation (Grade 1)',
    last200Braille: 'Last 200 characters shown in Braille',
    microphoneRequired: 'Microphone required',
    microphoneActive: 'Microphone is active',
    speakClearlyHint: 'Speak clearly at moderate pace',
    lastSpoken: 'Last spoken',
    tipsForBetterRecognition: 'Tips for better speech recognition',
    tipSpeakClearly: 'Speak clearly and at a normal pace',
    tipReduceNoise: 'Reduce background noise',
    tipHoldCloser: 'Hold phone closer to your mouth',
    tipShortPhrases: 'Speak in short phrases',
  },
  si: {
    appName: 'නෙත් සවන්',
    tagline: 'දෘශ්‍ය ශ්‍රවණ සහායක',
    alertsOn: 'ඇඟවීම් ක්‍රියාත්මකයි',
    alertsOff: 'ඇඟවීම් අක්‍රියයි',
    roadSafeOn: 'මාර්ග ආරක්ෂාව ක්‍රියාත්මකයි',
    roadSafeOff: 'මාර්ග ආරක්ෂාව අක්‍රියයි',
    listening: 'සවන් දෙමින්',
    stopped: 'නවතා ඇත',
    guest: 'අමුත්තා',
    localData: 'දේශීය දත්ත',
    online: 'සබැඳි',
    user: 'පරිශීලක',
    signOut: 'පිටවන්න',
    howItWorks: 'මෙය ක්‍රියා කරන ආකාරය',

    home: 'මුල් පිටුව',
    homeEn: 'Home',
    aiVision: 'AI දෘෂ්ටිය',
    aiVisionEn: 'AI Vision',
    learnSigns: 'සංඥා ඉගෙන ගන්න',
    learnSignsEn: 'Learn Signs',
    community: 'ප්‍රජාව',
    communityEn: 'Community',
    alerts: 'ඇඟවීම්',
    alertsEn: 'Alerts',
    contacts: 'සම්බන්ධතා',
    contactsEn: 'Contacts',
    sosSide: 'හදිසි අවස්ථා',
    sosSideEn: 'SOS',
    roadMonitor: 'මාර්ග ආරක්ෂාව',
    roadMonitorEn: 'Road Monitor',
    accessibility: 'ප්‍රවේශ්‍යතාව',
    accessibilityEn: 'Accessibility',

    sosCenter: 'හදිසි SOS මධ්‍යස්ථානය',
    sos: 'SOS',
    police: 'පොලිසිය',
    ambulance: 'ගිලන් රථය',
    emergencyInstructions: 'හදිසි උපදෙස්',
    redFlashing: 'රතු දැල්වෙන තිරය = හදිසි අවස්ථාවක් හෝ SOS සක්‍රිය කර ඇත',
    vibration: 'දුරකථන කම්පනය = ඔබේ සම්බන්ධතා වෙත අනතුරු ඇඟවීමක් යවමින්',
    contactsNotify: 'හදිසි සම්බන්ධතා = WhatsApp/SMS අනතුරු ඇඟවීම් ලැබෙනු ඇත',
    liveLocation: 'සජීවී ස්ථානය = හදිසි සම්බන්ධතා සමඟ ස්වයංක්‍රීයව බෙදාගනී',
    notificationToggle: '🔕 ඇඟවීම් ටොගලය = අවශ්‍ය විට අනතුරු ඇඟවීම් අක්‍රිය කරන්න',

    loggedOut: 'පිටවීම සාර්ථකයි',
    logoutFailed: 'පිටවීම අසාර්ථකයි',
    guestModeActivated: 'අමුත්තන්ගේ ප්‍රකාරය සක්‍රිය කරන ලදී',
    guestSignedOut: 'අමුත්තන්ගේ ප්‍රකාරයෙන් පිටවිය',
    switchedToSinhala: 'සිංහලට මාරු විය',
    switchedToEnglish: 'ඉංග්‍රීසි වෙත මාරු විය',

    accessibilitySettings: 'ප්‍රවේශ්‍යතා සැකසුම්',
    fontSize: 'අකුරු ප්‍රමාණය',
    colorAccessibility: 'වර්ණ ප්‍රවේශ්‍යතාව',
    colorThemes: 'වර්ණ තේමා',
    resetAll: 'සියලු සැකසුම් යළි පිහිටුවන්න',
    dedicatedRoadSafety: 'හොරන්, සයිරන්, එන්ජින් හඳුනාගැනීම',
    noEmergencyAlerts: 'ඔබට දෘශ්‍ය ඇඟවීම් හෝ හදිසි දැල්වීම් නොලැබේ.',
    enableNow: 'දැන් සක්‍රිය කරන්න',

    roadSafetyMonitor: 'මාර්ග ආරක්ෂණ මොනිටරය',
    startMonitoring: 'මාර්ග ආරක්ෂණ මොනිටරය ආරම්භ කරන්න',
    stopMonitoring: 'මොනිටරය නවත්වන්න',
    safetyTips: 'බිහිරි පදිකයින් සඳහා ආරක්ෂණ ඉඟි',

    emergencyContacts: 'හදිසි සම්බන්ධතා',
    addContact: '+ සම්බන්ධතාවක් එක් කරන්න',
    fullName: 'සම්පූර්ණ නම *',
    phoneNumber: 'දුරකථන අංකය',
    email: 'විද්‍යුත් තැපෑල',
    relation: 'ඥාතිත්වය',
    notificationMethods: 'දැනුම්දීමේ ක්‍රම',
    whatsapp: 'WhatsApp',
    sms: 'කෙටි පණිවුඩය',
    phoneCall: 'දුරකථන ඇමතුම',
    desktop: 'පරිගණකය',
    autoSendWhatsApp: 'හදිසි අවස්ථාවකදී ස්වයංක්‍රීයව WhatsApp යවන්න',
    saveContact: 'සම්බන්ධතාව සුරකින්න',
    cancel: 'අවලංගු කරන්න',
    noContacts: 'හදිසි සම්බන්ධතා කිසිවක් එක් කර නොමැත.',
    edit: 'සංස්කරණය',
    remove: 'ඉවත් කරන්න',

    liveCaptionsSign: 'සජීවී පාඨ සහ සංඥා භාෂාව',
    soundMonitor: 'ශබ්ද නිරීක්ෂක',
    soundWaveHistory: 'ශබ්ද තරංග සහ ඉතිහාසය',
    startListening: 'සවන් දීම ආරම්භ කරන්න',
    stopListening: 'සවන් දීම නවත්වන්න',
    words: 'වචන',
    characters: 'අක්ෂර',
    pressStartToListen: 'පහත "සවන් දීම ආරම්භ කරන්න" ඔබන්න, ඉන්පසු පාඨ බලන්න කතා කරන්න',
    browserNotSupported: 'ඔබගේ බ්‍රවුසරය හඬ හඳුනාගැනීමට සහාය නොදක්වයි. Chrome, Edge, හෝ Safari (iOS 14.3+) භාවිතා කරන්න.',
    mobileMicrophoneRequired: 'ජංගම මයික්‍රෆෝනය අවශ්‍යයි',
    mobileMicrophoneHint: 'ඔබ "සවන් දීම ආරම්භ කරන්න" තට්ටු කළ විට, ඔබගේ බ්‍රවුසරය මයික්‍රෆෝන අවසරය ඉල්ලයි. කරුණාකර එයට අවසර දෙන්න.',
    brailleTranslation: 'බ්‍රේල් පරිවර්තනය (1 ශ්‍රේණිය)',
    last200Braille: 'අවසන් අක්ෂර 200 බ්‍රේල් වලින් දක්වා ඇත',
    microphoneRequired: 'මයික්‍රෆෝනය අවශ්‍යයි',
    microphoneActive: 'මයික්‍රෆෝනය ක්‍රියාකාරීයි',
    speakClearlyHint: 'පැහැදිලිව මධ්‍යස්ථ වේගයෙන් කතා කරන්න',
    lastSpoken: 'අවසන් වරට කතා කළේ:',
    tipsForBetterRecognition: 'වඩා හොඳ හඬ හඳුනාගැනීම සඳහා ඉඟි',
    tipSpeakClearly: 'පැහැදිලිව සාමාන්‍ය වේගයෙන් කතා කරන්න',
    tipReduceNoise: 'පසුබිම් ශබ්දය අඩු කරන්න',
    tipHoldCloser: 'දුරකථනය ඔබේ මුඛයට සමීප කර ගන්න',
    tipShortPhrases: 'කෙටි වාක්‍ය වලින් කතා කරන්න',
  }
};

const detectLanguage = (text) => {
  if (!text) return null;
  if (/[\u0D80-\u0DFF]/.test(text)) return 'si';
  if (/[A-Za-z]/.test(text)) return 'en';
  return null;
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const t = useCallback((key) => translations[language][key] || translations.en[key] || key, [language]);
  const updateLanguageFromTranscript = useCallback((transcriptText) => {
    const detected = detectLanguage(transcriptText);
    if (detected && detected !== language) setLanguage(detected);
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t, updateLanguageFromTranscript }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);