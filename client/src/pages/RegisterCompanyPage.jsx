import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const RegisterCompanyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Company Info, Step 2: Admin User

  const [formData, setFormData] = useState({
    // Company Info
    companyName: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    customIndustry: '', // For "Other" option
    logoUrl: '',
    primaryColor: '#1e40af',

    // Admin User
    adminEmail: '',
    adminPassword: '',
    adminConfirmPassword: '',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  const [errors, setErrors] = useState({});

  // Auto-generate slug from company name
  const handleCompanyNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData({
      ...formData,
      companyName: name,
      slug: slug,
    });
    setErrors({ ...errors, companyName: '', slug: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle industry selection
    if (name === 'industry') {
      if (value === 'Other') {
        setShowCustomIndustry(true);
      } else {
        setShowCustomIndustry(false);
        setFormData({
          ...formData,
          industry: value,
          customIndustry: '',
        });
      }
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({ ...errors, [name]: '' });
  };

  // Handle logo file upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, logoUrl: 'Please upload a valid image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, logoUrl: 'File size must be less than 5MB' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        setFormData({
          ...formData,
          logoUrl: e.target.result, // Store as base64 or data URL
        });
        setErrors({ ...errors, logoUrl: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate Company Info
  const validateCompanyInfo = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Company slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase, alphanumeric with hyphens only';
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'Slug must be at least 3 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[\d+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    // Validate custom industry if "Other" is selected
    if (formData.industry === 'Other' && !formData.customIndustry.trim()) {
      newErrors.customIndustry = 'Please specify your industry';
    }

    if (!formData.primaryColor) {
      newErrors.primaryColor = 'Primary color is required';
    } else if (!/^#[0-9A-F]{6}$/i.test(formData.primaryColor)) {
      newErrors.primaryColor = 'Invalid color format. Use hex color (e.g., #1e40af)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Admin User
  const validateAdminUser = () => {
    const newErrors = {};

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Invalid email format';
    }

    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Password is required';
    } else if (formData.adminPassword.length < 6) {
      newErrors.adminPassword = 'Password must be at least 6 characters';
    }

    if (formData.adminPassword !== formData.adminConfirmPassword) {
      newErrors.adminConfirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCompanyInfo()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAdminUser()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.companies.register({
        companyName: formData.companyName,
        slug: formData.slug,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        industry: formData.industry === 'Other' ? formData.customIndustry : formData.industry || null,
        logoUrl: formData.logoUrl || null,
        primaryColor: formData.primaryColor,
      });

      toast.success('Company registered successfully!');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { companySlug: formData.slug } });
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header - Not Sticky */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-lg">
          <h1 className="text-3xl font-bold text-center">Register Company</h1>
          <p className="text-blue-100 text-center mt-2">
            {step === 1 ? 'Step 1: Company Information' : 'Step 2: Admin User'}
          </p>

          {/* Progress Bar */}
          <div className="flex gap-2 mt-6">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-blue-400'}`}></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-blue-400'}`}></div>
          </div>
        </div>

        {/* Form Container - Scrollable */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Company Information */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Company Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleCompanyNameChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.companyName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="e.g., NPA Corporation"
                  />
                  {errors.companyName && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.companyName}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    URL Slug (auto-generated) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.slug ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="e.g., npa-corp"
                  />
                  {errors.slug && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.slug}</p>
                  )}
                  {formData.slug && !errors.slug && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Your workspace: <span className="font-mono font-bold bg-blue-50 px-2 py-1 rounded">{formData.slug}</span>.app.example.com
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="contact@company.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="+233501234567"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition focus:border-blue-500"
                    placeholder="123 Business Street, Accra"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition focus:border-blue-500"
                  >
                    <option value="">Select Industry</option>
                    <option value="Retail">Retail</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Stationery">Stationery & Printing</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other</option>
                  </select>
                  
                  {/* Custom Industry Input - Shows when "Other" is selected */}
                  {showCustomIndustry && (
                    <div className="mt-3">
                      <input
                        type="text"
                        name="customIndustry"
                        value={formData.customIndustry}
                        onChange={handleInputChange}
                        placeholder="Please specify your industry"
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition focus:border-blue-500 bg-blue-50"
                      />
                      {errors.customIndustry && (
                        <p className="text-red-600 text-sm mt-1 font-medium">{errors.customIndustry}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* DIVIDER */}
                <div className="border-t-2 border-gray-200 pt-6 my-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Company Branding</h3>
                </div>

                {/* Company Logo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Company Logo (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                  {errors.logoUrl && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.logoUrl}</p>
                  )}
                  {logoPreview && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-blue-300">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Logo Preview:</p>
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-24 w-24 object-contain rounded border-2 border-gray-300"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-2">📁 Max file size: 5MB (PNG, JPG, GIF)</p>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Primary Brand Color <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-3 items-end">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600 mb-1">Color Picker:</span>
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="h-14 w-20 border-2 border-gray-300 rounded cursor-pointer hover:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-600 mb-1 block">Hex Code:</span>
                      <input
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        placeholder="#1e40af"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm ${
                          errors.primaryColor ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                  {errors.primaryColor && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.primaryColor}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">🎨 Use hex format: #RRGGBB (e.g., #1e40af)</p>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all mt-8 shadow-lg"
                >
                  Next: Admin User →
                </button>
              </div>
            )}

            {/* STEP 2: Admin User */}
            {step === 2 && (
              <div className="space-y-5">
                <p className="text-gray-700 text-sm mb-6">Create credentials for the admin user who will manage this company.</p>

                {/* Admin Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Admin Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.adminEmail ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="admin@company.com"
                  />
                  {errors.adminEmail && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.adminEmail}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    required
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.adminPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.adminPassword && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.adminPassword}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">🔐 Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    name="adminConfirmPassword"
                    required
                    value={formData.adminConfirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.adminConfirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.adminConfirmPassword && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.adminConfirmPassword}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 border-2 border-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {loading ? '⏳ Creating...' : '✓ Register Company'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 rounded-b-lg border-t-2 border-gray-200 text-center text-sm text-gray-700">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 font-bold underline"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompanyPage;
