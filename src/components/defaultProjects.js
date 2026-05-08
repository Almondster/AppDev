/**
 * Default project/service data for the CREATECH platform.
 * 
 * type: 'service' → a gig published by a creator (no client yet)
 * type: 'order'   → a hired service (client auto-assigned when they click "Hire")
 */
const defaultProjects = [
  // ── Active orders (services that have been hired by clients) ──
  { id: 1, type: 'order', title: 'Logo Design for EcoBrand', creator: 'You', clientName: 'GreenCo', status: 'In Progress', budget: 500, deadline: '2026-03-15', description: 'Modern eco-friendly brand identity' },
  { id: 2, type: 'order', title: 'Website Redesign', creator: 'You', clientName: 'TechStart', status: 'In Progress', budget: 1200, deadline: '2026-04-01', description: 'Full responsive redesign', adminNote: 'High profile flag: Monitoring for scope creep disputes.' },
  { id: 3, type: 'order', title: '3D Video Animation', creator: 'You', clientName: 'AniHub', status: 'Pending', budget: 800, deadline: '2026-03-20', description: 'Product showcase animation' },
  { id: 4, type: 'order', title: 'Audio Edits', creator: 'You', clientName: 'Shiko', status: 'Suspended', budget: 900, deadline: '2026-03-10', description: 'Podcast post-production editing', adminNote: 'Disabled due to pending copyright violation strike.' },
  { id: 5, type: 'order', title: 'UI/UX Design', creator: 'Jane Smith', clientName: 'Shaki', status: 'Pending', budget: 900, deadline: '2026-04-15', description: 'Mobile app interface design' },

  // ── Completed orders ──
  { id: 6, type: 'order', title: 'Brand Identity Package', creator: 'Jane Smith', clientName: 'GreenCo', status: 'Completed', budget: 1200, deadline: '2026-01-15', description: 'Complete brand identity' },
  { id: 7, type: 'order', title: 'Social Media Graphics', creator: 'You', clientName: 'TechStart', status: 'Completed', budget: 600, deadline: '2026-01-22', description: 'Social media content pack' },
  { id: 8, type: 'order', title: 'Product Photography', creator: 'Max Media', clientName: 'ShopEase', status: 'Completed', budget: 800, deadline: '2026-01-28', description: 'E-commerce product shots' },
  { id: 9, type: 'order', title: 'Promotional Video', creator: 'Pixel Wizards', clientName: 'AniHub', status: 'Completed', budget: 2500, deadline: '2026-02-01', description: 'Marketing promo video' },
  { id: 10, type: 'order', title: 'Mobile App UI Design', creator: 'You', clientName: 'AppVenture', status: 'Completed', budget: 3000, deadline: '2026-02-03', description: 'Full mobile app UI' },
  { id: 11, type: 'order', title: 'Business Card Design', creator: 'You', clientName: 'PrintHub', status: 'Completed', budget: 300, deadline: '2026-02-05', description: 'Professional business cards' },
  { id: 12, type: 'order', title: 'Infographic Design', creator: 'You', clientName: 'DataViz', status: 'Completed', budget: 700, deadline: '2026-02-07', description: 'Data visualization graphics' },
  { id: 13, type: 'order', title: 'Email Template Design', creator: 'You', clientName: 'MailPro', status: 'Completed', budget: 450, deadline: '2026-02-08', description: 'Responsive email templates' },
  { id: 14, type: 'order', title: 'Podcast Cover Art', creator: 'You', clientName: 'SoundWave', status: 'Completed', budget: 350, deadline: '2026-02-09', description: 'Podcast branding artwork' },
  { id: 15, type: 'order', title: 'Banner Ad Set', creator: 'You', clientName: 'AdClick', status: 'Completed', budget: 500, deadline: '2026-02-10', description: 'Digital ad banners' },
  { id: 16, type: 'order', title: 'Presentation Deck', creator: 'You', clientName: 'PitchPerfect', status: 'Completed', budget: 900, deadline: '2026-02-11', description: 'Investor pitch deck' },
  { id: 17, type: 'order', title: 'Icon Set Design', creator: 'You', clientName: 'IconLab', status: 'Completed', budget: 400, deadline: '2026-02-12', description: 'Custom icon library' },
  { id: 18, type: 'order', title: 'Packaging Design', creator: 'You', clientName: 'BoxCraft', status: 'Completed', budget: 1100, deadline: '2026-02-13', description: 'Product packaging' },
  { id: 19, type: 'order', title: 'T-Shirt Graphic', creator: 'You', clientName: 'WearArt', status: 'Completed', budget: 250, deadline: '2026-02-14', description: 'Apparel graphic design' },
  { id: 20, type: 'order', title: 'Menu Design', creator: 'You', clientName: 'FoodieSpot', status: 'Completed', budget: 350, deadline: '2026-02-14', description: 'Restaurant menu layout' },
  { id: 21, type: 'order', title: 'Flyer Design', creator: 'You', clientName: 'EventPro', status: 'Completed', budget: 200, deadline: '2026-02-15', description: 'Event promotional flyer' },
  { id: 22, type: 'order', title: 'Sticker Pack Design', creator: 'You', clientName: 'StickerCo', status: 'Completed', budget: 150, deadline: '2026-02-16', description: 'Custom sticker set' },

  // ── Published services (available on marketplace, not yet hired) ──
  { id: 100, type: 'service', title: 'Custom Illustration', creator: 'Jane Smith', status: 'Active', budget: 600, description: 'Hand-drawn digital illustration for branding, editorial, or personal use.' },
  { id: 101, type: 'service', title: 'Motion Graphics Package', creator: 'Pixel Wizards', status: 'Active', budget: 1800, description: 'Professional motion graphics for social media, ads, or presentations.' },
  { id: 102, type: 'service', title: 'Full Brand Strategy', creator: 'Max Media', status: 'Active', budget: 2500, description: 'End-to-end brand strategy including logo, colors, typography, and guidelines.' },
  { id: 103, type: 'service', title: 'Explainer Video', creator: 'Pixel Wizards', status: 'Active', budget: 3500, description: '60-second animated explainer video with scriptwriting and voiceover.' },
  { id: 104, type: 'service', title: 'WordPress Website', creator: 'Jane Smith', status: 'Active', budget: 4000, description: 'Complete WordPress site with custom theme, SEO, and responsive design.' },
  { id: 105, type: 'service', title: 'Product Photography Bundle', creator: 'Max Media', status: 'Active', budget: 1200, description: '10 high-quality product photos with editing and retouching.' },
];

export default defaultProjects;
