import { Service } from '../types/Service';

// Service data with icons using Material-UI icon paths
export const services: Service[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Get leads from Gmail emails',
    iconUrl: 'mail',
    isConnected: false
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect to Instagram DMs',
    iconUrl: 'photo_camera',
    isConnected: false
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Get leads from Facebook Messenger',
    iconUrl: 'facebook',
    isConnected: false
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    description: 'Connect to Airbnb messages',
    iconUrl: 'home',
    isConnected: false
  },
  {
    id: 'takeachef',
    name: 'Take a Chef',
    description: 'Import leads from Take a Chef',
    iconUrl: 'restaurant_menu',
    isConnected: false
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect to WhatsApp messages',
    iconUrl: 'chat',
    isConnected: false
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Get leads from TikTok messages',
    iconUrl: 'video_library',
    isConnected: false
  },
  {
    id: 'sms',
    name: 'Phone (SMS)',
    description: 'Receive leads from SMS messages',
    iconUrl: 'phone',
    isConnected: false
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Connect to Wix form submissions',
    iconUrl: 'web',
    isConnected: false
  },
  {
    id: 'manual',
    name: 'Manual Upload',
    description: 'Manually upload lead data',
    iconUrl: 'upload_file',
    isConnected: false
  },
  {
    id: 'yelp',
    name: 'Yelp',
    description: 'Connect to Yelp inquiries',
    iconUrl: 'star',
    isConnected: false,
    disabled: true
  },
  {
    id: 'opentable',
    name: 'OpenTable',
    description: 'Import leads from OpenTable',
    iconUrl: 'restaurant',
    isConnected: false,
    disabled: true
  }
];
