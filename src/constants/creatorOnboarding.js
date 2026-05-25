export const CREATOR_MAIN_CATEGORIES = [
  'Design & Creative',
  'Development & IT',
  'Writing & Translation',
  'Digital Marketing',
  'Video & Animation',
  'Music & Audio',
];

export const CREATOR_SUBCATEGORY_MAP = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

const toLocalPhilippinePhone = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63') && digits.length >= 12) return digits.slice(2, 12);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  if (digits.startsWith('9') && digits.length === 10) return digits;
  return digits.slice(0, 10);
};

export const createInitialCreatorForm = (profile = '') => {
  const source = typeof profile === 'string' ? { full_name: profile } : (profile || {});
  const fullName = String(source.full_name || source.username || '').trim();
  const [derivedFirstName = '', ...derivedRest] = fullName.split(/\s+/).filter(Boolean);
  const derivedLastName = derivedRest.join(' ');

  return {
    first_name: source.first_name || derivedFirstName,
    middle_name: source.middle_name || '',
    last_name: source.last_name || derivedLastName,
    phone: toLocalPhilippinePhone(source.phone || ''),
    id_number: '',
    id_front_url: '',
    id_back_url: '',
    id_selfie_url: '',
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Philippines',
    category: '',
    skills: [],
    bio: '',
    experience_years: '',
    starting_price: '',
    turnaround_time: '',
    portfolio_url: '',
    agreed: false,
  };
};
