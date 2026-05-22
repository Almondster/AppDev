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

export const createInitialCreatorForm = (fullName = '') => {
  const [firstName = '', ...rest] = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    first_name: firstName,
    middle_name: '',
    last_name: rest.join(' '),
    phone: '',
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
