import React, { useState, useRef } from 'react';
import { X, Check, ArrowRight, Upload, AlertCircle, Camera, Plus, Trash2 } from 'lucide-react';
import { getToken } from '../api';

const MAIN_CATEGORIES = [
    { id: 'cat1', label: 'Design & Creative' },
    { id: 'cat2', label: 'Development & IT' },
    { id: 'cat3', label: 'Writing & Translation' },
    { id: 'cat4', label: 'Digital Marketing' },
    { id: 'cat5', label: 'Video & Animation' },
    { id: 'cat6', label: 'Music & Audio' },
];

const SUBCATEGORY_MAP = {
    'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
    'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
    'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
    'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
    'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
    'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

const COUNTRIES = [
    { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭', placeholder: '0912 345 6789', regex: /^09\d{9}$/, maxLength: 11 },
    { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', placeholder: '(555) 123-4567', regex: /^\d{10}$/, maxLength: 10 },
];

export const CreatorOnboardingModal = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Identity State
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [idNumber, setIdNumber] = useState('');

    // Address State
    const [streetAddress, setStreetAddress] = useState('');
    const [barangay, setBarangay] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('Philippines');

    // ID Images
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [idSelfie, setIdSelfie] = useState(null);
    const [idFrontPreview, setIdFrontPreview] = useState(null);
    const [idBackPreview, setIdBackPreview] = useState(null);
    const [idSelfiePreview, setIdSelfiePreview] = useState(null);

    // Profile State
    const [bio, setBio] = useState('');
    const [experience, setExperience] = useState('');
    const [minRate, setMinRate] = useState('');
    const [turnaround, setTurnaround] = useState('');
    const [category, setCategory] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [customSkills, setCustomSkills] = useState([]);
    const [customSkillInput, setCustomSkillInput] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [agreed, setAgreed] = useState(false);

    // Refs for file inputs
    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);
    const selfieInputRef = useRef(null);

    const validateImage = (file) => {
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            return 'Invalid File: ID/Selfie images must be JPG or PNG format.';
        }
        if (file.size > 5 * 1024 * 1024) {
            return 'File Too Large: Image must be smaller than 5MB.';
        }
        return null;
    };

    const handleFileChange = async (e, type) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const validationError = validateImage(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => {
                img.onload = () => {
                    if (img.width < 400 || img.height < 300) {
                        setError('Image Too Small: Image must be at least 400x300 pixels for verification.');
                        resolve(false);
                    } else if (img.width > 4096 || img.height > 4096) {
                        setError('Image Too Large: Image must be less than 4096x4096 pixels.');
                        resolve(false);
                    } else {
                        setError(null);
                        const preview = img.src;
                        if (type === 'front') {
                            setIdFront(file);
                            setIdFrontPreview(preview);
                        } else if (type === 'back') {
                            setIdBack(file);
                            setIdBackPreview(preview);
                        } else {
                            setIdSelfie(file);
                            setIdSelfiePreview(preview);
                        }
                        resolve(true);
                    }
                };
            });
        }
    };

    const validateStep1 = () => {
        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !idNumber.trim()) 
            return "Please fill in all identity fields. First & Last Name are required.";
        if (!streetAddress.trim() || !city.trim()) 
            return "Please provide at least Street Address and City.";
        if (!/^\d{12}$/.test(idNumber)) 
            return "Invalid ID Number: Please enter a valid 12-digit Government ID number (Numeric only).";

        const cleanPhone = phone.replace(/\D/g, '');
        if (!selectedCountry.regex.test(cleanPhone)) 
            return `Invalid Phone Number: ${selectedCountry.code === 'PH' ? 'Please enter a valid 11-digit PH mobile number starting with 09' : 'Please enter a valid phone number'}`;

        if (selectedCountry.code === 'PH' && postalCode.length !== 4) {
            return "Invalid Postal Code: Philippines postal codes must be exactly 4 digits.";
        }

        if (!idFront || !idBack || !idSelfie) 
            return "ID Photos Required: Please upload all 3 verification photos: Front of ID, Back of ID, and Selfie with ID.";

        return null;
    };

    const validateStep2 = () => {
        if (!bio.trim() || !experience.trim() || !minRate.trim() || !turnaround.trim()) 
            return "Incomplete Profile: Please fill in all profile fields: Experience, Rate, Turnaround, Bio & Skills.";
        if (!category) 
            return "Category Missing: Please select a main service category.";
        if (selectedSkills.length === 0 && customSkills.length === 0) 
            return "Skills Missing: Please select at least one skill.";
        if (!agreed) 
            return "Agreement Needed: You must agree to the terms to continue.";
        return null;
    };

    const handleNext = () => {
        setError(null);
        if (step === 1) {
            const err = validateStep1();
            if (err) {
                setError(err);
                return;
            }
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const uploadImage = async (file, filename) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = getToken();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/uploads/id-verification?filename=${filename}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Upload failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.url;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Upload timed out. Please try again.');
            }
            throw error;
        }
    };

    const handleSubmit = async () => {
        const err = validateStep2();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const token = getToken();
            if (!token) throw new Error("No authentication token found");

            // Upload Images with progress feedback
            setError("Uploading ID photos...");
            const timestamp = Date.now();
            const frontUrl = await uploadImage(idFront, `front_${timestamp}.jpg`);
            const backUrl = await uploadImage(idBack, `back_${timestamp}.jpg`);
            const selfieUrl = await uploadImage(idSelfie, `selfie_${timestamp}.jpg`);

            const cleanPhone = phone.replace(/\D/g, '');
            const fullPhone = `${selectedCountry.dialCode}${cleanPhone}`;

            // Submit Application
            setError("Submitting application...");
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/creator-applications/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName,
                    phone: fullPhone,
                    id_number: idNumber,
                    id_front_url: frontUrl,
                    id_back_url: backUrl,
                    id_selfie_url: selfieUrl,
                    street_address: streetAddress,
                    barangay: barangay,
                    city: city,
                    province: province,
                    postal_code: postalCode,
                    country: country,
                    bio: bio,
                    experience_years: experience,
                    starting_price: minRate,
                    turnaround_time: turnaround,
                    category: category,
                    skills: [...selectedSkills, ...customSkills],
                    portfolio_url: portfolio,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Submission failed: ${response.status}`);
            }

            setError(null);
            onComplete();
        } catch (e) {
            console.error('Application submission error:', e);
            if (e.name === 'AbortError') {
                setError("Request timed out. Please try again.");
            } else {
                setError(e.message || "An error occurred during submission.");
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSkill = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const addCustomSkill = () => {
        const trimmed = customSkillInput.trim();
        if (trimmed && !customSkills.includes(trimmed) && !selectedSkills.includes(trimmed)) {
            setCustomSkills([...customSkills, trimmed]);
            setCustomSkillInput('');
        }
    };

    const removeCustomSkill = (skill) => {
        setCustomSkills(prev => prev.filter(s => s !== skill));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A]">
                    <div>
                        <h2 className="text-lg font-medium text-white">Become a Creator</h2>
                        <p className="text-xs text-zinc-500">Step {step} of 2: {step === 1 ? 'Identity Verification' : 'Creator Profile'}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle size={20} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-8">
                            {/* Identity Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="First Name" 
                                        value={firstName} 
                                        onChange={e => setFirstName(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Middle Name" 
                                        value={middleName} 
                                        onChange={e => setMiddleName(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Last Name" 
                                        value={lastName} 
                                        onChange={e => setLastName(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 flex items-center gap-2 text-zinc-400">
                                            <span>{selectedCountry.flag}</span>
                                            <span className="text-xs">{selectedCountry.dialCode}</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={selectedCountry.placeholder}
                                            value={phone}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= selectedCountry.maxLength) setPhone(val);
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-20 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="12-Digit ID Number"
                                        value={idNumber}
                                        onChange={e => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Residential Address</h3>
                                <input 
                                    type="text" 
                                    placeholder="Street Address / Building" 
                                    value={streetAddress} 
                                    onChange={e => setStreetAddress(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Barangay" 
                                        value={barangay} 
                                        onChange={e => setBarangay(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="City / Municipality" 
                                        value={city} 
                                        onChange={e => setCity(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Province" 
                                        value={province} 
                                        onChange={e => setProvince(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input
                                        type="text"
                                        placeholder="Postal Code"
                                        value={postalCode}
                                        onChange={e => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>

                            {/* ID Uploads */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">ID Verification</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Front of ID', ref: frontInputRef, preview: idFrontPreview, type: 'front' },
                                        { label: 'Back of ID', ref: backInputRef, preview: idBackPreview, type: 'back' },
                                        { label: 'Selfie with ID', ref: selfieInputRef, preview: idSelfiePreview, type: 'selfie' },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            onClick={() => item.ref.current?.click()}
                                            className="aspect-[4/3] bg-white/5 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden relative group"
                                        >
                                            {item.preview ? (
                                                <>
                                                    <img src={item.preview} alt={item.label} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera className="text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="text-zinc-500 mb-2" size={24} />
                                                    <span className="text-xs text-zinc-400">{item.label}</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                ref={item.ref}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, item.type)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Profile Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Professional Profile</h3>
                                <textarea
                                    placeholder="Tell us about your expertise..."
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input 
                                        type="number" 
                                        placeholder="Years of Exp." 
                                        value={experience} 
                                        onChange={e => setExperience(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Min. Rate (₱)" 
                                        value={minRate} 
                                        onChange={e => setMinRate(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Turnaround (e.g. 3 days)" 
                                        value={turnaround} 
                                        onChange={e => setTurnaround(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Portfolio URL (Optional)" 
                                    value={portfolio} 
                                    onChange={e => setPortfolio(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                                />
                            </div>

                            {/* Category & Skills */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Skills & Category</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {MAIN_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setCategory(cat.label);
                                                setSelectedSkills([]);
                                            }}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all ${category === cat.label
                                                ? 'bg-purple-500/10 border-purple-500 text-white'
                                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {category && SUBCATEGORY_MAP[category] && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {SUBCATEGORY_MAP[category].map(skill => (
                                            <button
                                                key={skill}
                                                onClick={() => toggleSkill(skill)}
                                                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selectedSkills.includes(skill)
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                                }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Custom Skills */}
                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Custom Skills</h4>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={customSkillInput}
                                            onChange={(e) => setCustomSkillInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                                            placeholder="Add a custom skill..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={addCustomSkill}
                                            disabled={!customSkillInput.trim()}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-50"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    {customSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {customSkills.map(skill => (
                                                <div key={skill} className="px-3 py-1.5 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2">
                                                    <span>{skill}</span>
                                                    <button onClick={() => removeCustomSkill(skill)} className="hover:text-white">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div
                                    onClick={() => setAgreed(!agreed)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer mt-0.5 ${agreed ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'}`}
                                >
                                    {agreed && <Check size={14} className="text-white" />}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    I agree to the Creator Terms of Service and confirm that the information provided is accurate. I understand that my ID will be used for verification purposes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0A0A0A] flex justify-between items-center">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                            step === 2 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {step === 2 ? 'Submit Application' : 'Continue'}
                                {step === 2 ? <Check size={16} /> : <ArrowRight size={16} />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatorOnboardingModal;
