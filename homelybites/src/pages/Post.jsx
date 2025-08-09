import React, { useEffect, useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Image, Upload, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import axiosInstance from '../config/axiosInstance';
import { customToast } from './toast.jsx';

<Navbar />

const categoriesList = [
  { value: 'recipe', label: 'Recipe' },
  { value: 'tip', label: 'Cooking Tip' },
  { value: 'review', label: 'Restaurant Review' },
  { value: 'general', label: 'General Discussion' },
  { value: 'question', label: 'Question' }
];

import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required').max(255, 'Description must be at most 255 characters'),
  category: yup.string().required('Category is required'),
  image: yup.mixed().required('Image is required'),
});

const PostPage = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      image: null,
    },
    mode: 'onBlur',
  });
  const [uploadError, setUploadError] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    image: null,
    category: '',
    tag_names: []
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      setUserError('');
      try {
        const userRes = await axiosInstance.get('/api/user-profiles/my_profile/');
        setCurrentUser({
          name: userRes.data.user.first_name + ' ' + userRes.data.user.last_name,
          profile_image: userRes.data.profile_image
        });
      } catch (e) {
        setUserError('Failed to load user info');
        setCurrentUser({
          name: 'Guest User',
          profile_image: ''
        });
      }
      setUserLoading(false);
    };
    fetchUser();
  }, []);

  // Main upload handler
  const handleImageUpload = async (event) => {
    setUploadError('');
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPost(prev => ({
        ...prev,
        image: { file, preview: e.target.result, name: file.name, type: file.type }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.description.trim() || !newPost.category || !newPost.image) return;

    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('description', newPost.description);
      formData.append('category', newPost.category || selectedCategory);
      if (newPost.image && newPost.image.file) {
        formData.append('image', newPost.image.file);
      }
      newPost.tag_names.forEach((tag) => {
        formData.append('tag_names', tag);
      });
      // Optionally show loading state here
      // setLoading(true);
      const response = await axiosInstance.post('/api/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // setLoading(false);
      if (response.status === 201 || response.status === 200) {
        setNewPost({ title: '', description: '', image: null, category: '', tag_names: [] });
        customToast.success('Post created successfully!');
      } else {
        alert('Failed to create post.');
      }
    } catch (error) {
      // setLoading(false);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create post.';
      alert(msg);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const triggerFileInput = () => {
    document.getElementById('post-file-input').click();
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <div className="flex-2 px-5 md:px-12 py-3">
          <div className="mb-4">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-medium">Back</span>
            </button>
          </div>
          <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-3xl font-bold text-gray-800 text-center">Create Post</h2>
              {/* Show post title live preview if present */}
              
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Post Input Section */}
              <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                   {currentUser && (
                     <>
                       <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                         {currentUser.profile_image ? (
                           <>
                             <img
                               src={currentUser.profile_image}
                               alt={currentUser.name || 'User'}
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 const fallback = e.currentTarget.nextElementSibling;
                                 if (fallback) fallback.style.display = 'flex';
                               }}
                             />
                             <div style={{display:'none'}} className="items-center justify-center w-full h-full">
                               <PersonIcon style={{ fontSize: 28, color: '#9ca3af' }} />
                             </div>
                           </>
                         ) : (
                           <PersonIcon style={{ fontSize: 28, color: '#9ca3af' }} />
                         )}
                       </div>
                       <span className="font-bold text-gray-800">{currentUser.name || 'User'}</span>
                     </>
                   )}
                   {!currentUser && (
                     <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                       <PersonIcon style={{ fontSize: 28, color: '#9ca3af' }} />
                     </div>
                   )}
                </div>
                
                
<div className="flex flex-col gap-1 bg-white rounded-xl p-3 relative items-center">
                  <input
                        type="text"
                        {...register('title')}
                        value={newPost.title}
                        onChange={e => {
                          setNewPost(prev => ({ ...prev, title: e.target.value }));
                          setValue('title', e.target.value);
                        }}
                        placeholder="Title"
                        className="text-xl font-normal text-gray-800 w-full outline-none bg-transparent"
                        maxLength={100}
                      />
                      {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title.message}</div>}
                  <div className="w-full border-b border-dashed border-gray-400"></div>
                  <input
                    type="text"
                    {...register('description')}
                    value={newPost.description}
                    onChange={e => {
                      setNewPost(prev => ({ ...prev, description: e.target.value }));
                      setValue('description', e.target.value, { shouldValidate: true });
                    }}
                    placeholder="What is in your mind?"
                    className="outline-none text-lg text-gray-600 w-full"
                    maxLength={255}
                  />
                  <div className="flex justify-between w-full">
                    {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description.message}</div>}
                    <div className="text-xs text-gray-400 ml-auto">{newPost.description.length}/255</div>
                  </div>
                  
                </div>
                <div className="w-full flex justify-end mt-4">
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center px-3 py-2 rounded-lg bg-accent text-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition-colors hover:bg-accent/80 ${dropdownOpen ? 'ring-2 ring-accent' : ''}`}
                        onClick={() => setDropdownOpen((open) => !open)}
                      >
                        {categoriesList.find(cat => cat.value === selectedCategory)?.label || 'Choose category'}
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {dropdownOpen && (
                        <div className="absolute left-0 mt-2 w-44 rounded-lg shadow bg-white z-10 border border-gray-100">
                          {categoriesList.map((cat) => (
                            <button
                              key={cat.value}
                              className={`block w-full text-left px-4 py-2 text-gray-800 hover:bg-red-100 hover:text-red-500 transition-colors ${selectedCategory === cat.value ? 'bg-red-50 text-red-500' : ''}`}
                              onClick={() => { setSelectedCategory(cat.value); setDropdownOpen(false); setNewPost(prev => ({ ...prev, category: cat.value })); }}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

              </div>

              {/* Image Upload Area */}
              <div className="border-2 border-gray-200 rounded-2xl p-8">
                <div 
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 border-gray-300 hover:border-red-400 hover:bg-red-50 relative`}
                >
                  {newPost.image ? (
                    <div className="relative w-full h-60 md:h-80 rounded-xl overflow-hidden mb-2 flex items-end justify-start cursor-pointer" style={{minHeight:'240px'}} onClick={triggerFileInput}>
                      <img
                        src={URL.createObjectURL(newPost.image.file)}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <div className="z-10 bg-white/80 px-2 py-1 rounded-lg flex items-center ml-2 mb-2">
                        <svg className="w-4 h-4 mr-1 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16V4H4zm4 8h8m-4-4v8" /></svg>
                        <span className="text-xs text-red-500 font-semibold">Replace image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-red-400" />
                        </div>
                      </div>
                      <p className="text-gray-500 font-semibold">Add Photos/Video</p>
                      <p className="text-xs text-gray-400 mt-2">Only 1 image allowed</p>
                    </>
                  )}
                  <input
                    id="post-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>  
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="text-red-500 text-sm mb-2">{uploadError}</div>
              )}

            </div>

            {/* Category Dropdown and Footer in one line */}
            <div className="p-6 border-t border-gray-100 flex justify-end items-center">
              <button
                onClick={handleCreatePost}
                disabled={!newPost.title.trim() || !newPost.description.trim() || !newPost.category || !newPost.image}
                className="px-6 py-2 bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg"
              >
                Create Post
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PostPage;